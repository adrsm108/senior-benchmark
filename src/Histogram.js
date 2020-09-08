import React, {Component} from 'react';
import * as d3 from 'd3';
import {Popover, Select, Slider, Switch, Typography} from 'antd';
import {EllipsisOutlined} from '@ant-design/icons';
import {binnedKDE, classConcat, identity, last, toOrdinal} from './utils';
import './Histogram.less';

const {Option} = Select;
const {Title, Text} = Typography;

class Histogram extends Component {
  constructor(props) {
    super(props);
    /** @type {object} */
    this.ref = React.createRef();
    const xAxis = Object.assign(
      {digits: 2, title: '', units: ''},
      this.props.xAxis
    );
    const yAxis = Object.assign(
      {digits: 2, title: '', units: ''},
      this.props.yAxis
    );
    let padding = this.props.padding;
    if (typeof padding === 'number') {
      padding = {top: padding, bottom: padding, left: padding, right: padding};
    } else {
      padding = Object.assign(
        {top: 30, right: 30, bottom: 30, left: 30},
        padding
      );
    }

    this.state = {
      showHistogram: props.showHistogram,
      showDensity: props.showDensity,
      showPoints: props.showPoints,
      showMean: props.showMean,
      kernel: props.defaultKernel,
      bandwidth: props.defaultBandwidth,
      xAxis,
      yAxis,
      padding,
    };
  }

  initializeHistogram = () => {
    const {
      width,
      height,
      data: {binStart, binWidth, data: rawData},
      cutoff = binStart + last(rawData).bin * binWidth,
    } = this.props;
    const {padding} = this.state;
    const innerWidth = width - (padding.left + padding.right);
    const innerHeight = height - (padding.top + padding.bottom);

    const bins = Math.ceil((cutoff - binStart) / binWidth);
    const data = new Array(bins).fill(0);
    for (const {bin, freq} of rawData) if (bin < bins) data[bin] = freq;
    let tot = 0;
    const cumData = [0, ...data.map((freq) => (tot += freq))];

    const quantile = this.props.discreteQuantile
      ? d3
          .scaleThreshold()
          .domain([...cumData.keys()].map(x => x - 0.5))
          .range([...cumData, 1])
      : d3
          .scaleLinear()
          .domain([...cumData.keys(), last(rawData).bin])
          .range([...cumData, 1])
          .clamp(true);

    const yScale = d3
      .scaleLinear()
      .domain([0, data.reduce((a, x) => Math.max(a, x))])
      .range([innerHeight, 0]);

    // scale data coordinates to svg coordinates
    const xScaleData = d3
      .scaleLinear()
      .domain([0, bins - 1])
      .range([binStart, binStart + (bins - 1) * binWidth]);

    // scale bin index to svg coordinates
    const xScale = d3.scaleLinear().domain([0, bins]).range([0, innerWidth]);

    const easeEl = d3.easeElastic.amplitude(1.78).period(0.733);
    this.setState({
      hist: {
        innerWidth,
        innerHeight,
        xScale,
        xScaleData,
        yScale,
        bins,
        data,
        quantile,
        appear: d3.transition().duration(750),
        disappear: d3.transition().duration(400),
        appearEase: (t) => Math.max(easeEl(t), 0),
        disappearEase: d3.easeBackIn,
        areaGen: d3
          .area()
          .curve(d3.curveBasis)
          .x0((_, i) => xScale(i - 1 / 2))
          .y0(yScale(0))
          .y1((d) => yScale(d)),
        callout: (g, value, translateY = 0) => {
          if (!value) return g.style('display', 'none');

          g.style('display', null)
            .style('pointer-events', 'none')
            .style('user-select', 'none')
            .style('font', '10px sans-serif');

          // crosshair
          g.selectAll('circle.mouse-crosshair')
            .data([null])
            .join('circle')
            .classed('mouse-crosshair', true)
            .attr('cx', '0')
            .attr('cy', '0')
            .attr('r', '3px');

          // vertical line
          g.selectAll('line.vertical-line')
            .data([null])
            .join('line')
            .classed('vertical-line', true)
            .attr('x1', 0)
            .attr('x2', 0)
            .attr('y1', 0)
            .attr('y2', innerHeight - translateY);

          const path = g
            .selectAll('path')
            .data([null])
            .join('path')
            .attr('class', 'callout-background');

          const text = g
            .selectAll('text')
            .data([null])
            .join('text')
            .attr('font-size', '0.8rem')
            .attr('fill', 'black')
            .attr('text-anchor', 'middle')
            .call((text) =>
              text
                .selectAll('tspan')
                .data((value + '').split(/\n/))
                .join('tspan')
                .attr('x', 0)
                .attr('y', (d, i) => `${i * 1.1}em`)
                .style('font-weight', (_, i) => (i ? null : 'bold'))
                .text(identity)
            );
          const pad = 10;
          const {width: tw, height: th} = text.node().getBBox();
          path.attr(
            'd',
            `M 0, -5 
             l -5, -5
             H -${(tw + pad) / 2}
             v -${th + pad}
             H ${(tw + pad) / 2}
             v ${th + pad}
             H 5
             z
             `
          );
          text.attr('transform', `translate(0, -${(th + pad) / 2 + pad})`);
        },
      },
    });
  };

  drawHistogram = () => {
    const {
      innerWidth,
      innerHeight,
      xScale,
      xScaleData,
      yScale,
      data,
      appear,
      appearEase,
      disappear,
      disappearEase,
    } = this.state.hist;
    const {xAxis, yAxis, padding} = this.state;
    const histSel = d3.select(this.ref.current);

    const rootSvg = histSel
      .selectAll('svg.root-svg')
      .data([null])
      .join('svg')
      .attr('class', 'root-svg')
      .attr('viewBox', `0 0 ${this.props.width} ${this.props.height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');
    // .attr('width', this.props.width)
    // .attr('height', this.props.height);

    rootSvg
      .selectAll('defs')
      .data([null])
      .join('defs')
      .append('clipPath')
      .attr('id', 'rect-clip')
      .append('rect')
      .attr('x', 0)
      .attr('y', -padding.top)
      .attr('width', innerWidth)
      .attr('height', innerHeight + padding.top);

    const root = rootSvg
      .selectAll('g.root-transform')
      .data([null])
      .join('g')
      .attr('class', 'root-transform')
      .attr('transform', `translate(${padding.left},${padding.top})`);

    // Draw axes
    root
      .selectAll('g.x-axis')
      .data([null])
      .join('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .tickFormat((x) => xScaleData(x).toFixed(xAxis.digits))
      )
      .selectAll('text')
      .attr('transform', 'translate(-10, 0) rotate(-45)')
      .attr('class', 'x-axis-text');

    root
      .selectAll('g.y-axis')
      .data([null])
      .join('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale).tickFormat((y) => y.toFixed(yAxis.digits)))
      .selectAll('text')
      .attr('class', 'y-axis-text');

    // Draw bars
    root
      .selectAll('rect.histogram-bar')
      .data(this.state.showHistogram ? data : [])
      .join(
        (enter) =>
          enter
            .append('rect')
            .attr('class', 'histogram-bar')
            .attr('x', (_, i) => xScale(i))
            .attr('y', innerHeight)
            .attr('width', xScale(1))
            .attr('height', 0)
            .call((enter) =>
              enter
                .transition(appear)
                .ease(appearEase)
                .delay((_, i) => i * 20)
                .attr('height', (d) => innerHeight - yScale(d))
                .attr('y', yScale)
            ),
        (update) =>
          update.call((update) =>
            update
              .transition()
              .attr('height', (d) => innerHeight - yScale(d))
              .attr('y', yScale)
          ),
        (exit) =>
          exit.call((exit) =>
            exit
              .transition(disappear)
              .ease(disappearEase)
              // .delay((_, i, {length}) => (length - i) * 20)
              .attr('y', innerHeight)
              .attr('height', 0)
              .remove()
          )
      );

    this.updateDensity();
  };

  updateDensity = () => {
    const histSel = d3.select(this.ref.current);

    const {
      hist: {
        data,
        quantile,
        xScale,
        xScaleData,
        yScale,
        callout,
        innerWidth,
        innerHeight,
        appear,
        appearEase,
        disappear,
        disappearEase,
        areaGen,
      },
      kernel,
      bandwidth,
      showDensity,
      showPoints,
      showMean,
      xAxis,
      padding,
    } = this.state;
    const {points, ascending, percentilePrecision} = this.props;
    const pointData =
      points && showDensity && showPoints
        ? points.data.map(this.props.pointsAccessor)
        : [];
    if (pointData.length > 0 && showMean) {
      pointData.unshift(points['mean'] || d3.mean(pointData));
    }

    // pad array with zeros, which will later be clipped.
    // This gives us the freedom to shift our control points to the center of each interval.
    const density = showDensity
      ? binnedKDE([0, ...data, 0], kernel, bandwidth)
      : [0, 0];
    const dlen = density.length - 1;
    const interp = d3.interpolateBasis(density);
    const interpY = (x) => yScale(interp((x + 0.5) / dlen));
    const shift = 0.5 / dlen;

    // Generates float area
    const flatGen = d3
      .area()
      .curve(d3.curveBasis)
      .x((_, i) => xScale(i - 1 / 2))
      .y0(yScale(0))
      .y1(yScale(0));

    const densityTransitionChange = d3.transition().duration(100);

    const rootSel = histSel.selectAll('g.root-transform');

    const densityRoot = rootSel
      .selectAll('g.density-root')
      .data([null])
      .join('g')
      .attr('class', 'density-root')
      .raise();

    const densityArea = densityRoot
      .selectAll('path.density-area')
      .data(showDensity ? [density] : [])
      .join(
        (enter) =>
          enter
            .append('path')
            .attr('class', 'density-area')
            .attr('clip-path', 'url(#rect-clip)')
            .attr('d', flatGen)
            .call((enter) =>
              enter.transition(appear).ease(appearEase).attr('d', areaGen)
            ),
        (update) =>
          update.call((update) =>
            update.transition(densityTransitionChange).attr('d', areaGen)
          ),
        (exit) =>
          exit.call((exit) =>
            exit
              .transition(disappear)
              .transition(disappear)
              .ease(disappearEase)
              .attr('d', flatGen)
              .remove()
          )
      );

    const densityAreaNode = densityArea.node();

    const tooltip = densityRoot
      .selectAll('g.histogram-tooltip')
      .data(showDensity ? [null] : [])
      .join('g')
      .attr('class', 'histogram-tooltip');

    densityRoot
      .selectAll('circle.query-point')
      .data(pointData.map(xScaleData.invert))
      .join(
        (enter) =>
          enter
            .append('circle')
            .attr('class', (_, i) =>
              classConcat('query-point', showMean && !i && 'mean')
            )
            .attr('clip-path', 'url(#rect-clip)')
            .attr('cx', xScale)
            .attr('cy', interpY)
            .attr('r', 0)
            .call((enter) =>
              enter
                .transition(appear)
                .transition()
                .duration(250)
                .ease(d3.easeExpIn)
                .delay((_, i) => i * 25)
                .attr('r', showMean ? (_, i) => (i ? 3 : 4) : 3)
            ),
        (update) =>
          update.call((update) =>
            update
              .transition(densityTransitionChange)
              .attr('cy', interpY)
              .attr('cx', xScale)
              .attr('r', showMean ? (_, i) => (i ? 3 : 4) : 3)
          ),
        (exit) =>
          exit.call((exit) =>
            exit.transition(disappear).ease(disappearEase).attr('r', 0).remove()
          )
      );

    densityRoot
      .selectAll('rect.interaction-panel')
      .raise()
      .data(showDensity ? [null] : [])
      .join('rect')
      .attr('class', 'interaction-panel')
      .attr('fill', 'none')
      .attr('stroke', 'none')
      .attr('width', innerWidth)
      .attr('y', -padding.top)
      .attr('height', innerHeight + padding.top)
      .on('touchmove mousemove', function () {
        const mx = d3.mouse(densityAreaNode)[0];
        const areaWidth = densityAreaNode.getBBox().width;
        const px = mx / areaWidth;
        const x = px * dlen;
        const y = interp(px + shift);
        tooltip
          .attr('transform', `translate(${mx},${yScale(y)})`)
          .raise()
          .call(
            callout,
            `${xScaleData(x).toFixed(xAxis.digits)}${xAxis.units}\n${toOrdinal(
              (100 * (ascending ? quantile(x) : 1 - quantile(x))).toFixed(percentilePrecision)
            )} percentile`,
            yScale(y)
          );
      })
      .on('touchend mouseleave', function () {
        tooltip.call(callout, null);
      });
  };

  componentDidMount() {
    this.initializeHistogram();
  }

  render() {
    const {
      xAxis,
      yAxis,
      showHistogram,
      showDensity,
      showPoints,
      bandwidth,
      kernel,
    } = this.state;
    const {minWidth, maxWidth} = this.props;
    return (
      <div
        className={classConcat('Histogram', this.props.className)}
        style={{minWidth, maxWidth}}
      >
        <Popover
          trigger="click"
          placement="rightTop"
          content={
            <div className="settings-content">
              <div className="title-and-switch">
                <Title level={4}>Histogram</Title>
                <Switch
                  defaultChecked={showHistogram}
                  onChange={(value) => this.setState({showHistogram: value})}
                />
              </div>
              <div className="title-and-switch">
                <Title level={4}>Estimated Density</Title>
                <Switch
                  defaultChecked={showDensity}
                  onChange={(value) => this.setState({showDensity: value})}
                />
              </div>
              <div className="title-and-switch">
                <Title level={4}>Points</Title>
                <Switch
                  defaultChecked={showPoints}
                  disabled={!showDensity}
                  onChange={(value) => this.setState({showPoints: value})}
                />
              </div>
              <Text strong>Kernel Type</Text>
              <Select
                disabled={!showDensity}
                defaultValue={kernel}
                onChange={(value) => this.setState({kernel: value})}
              >
                <Option value="uniform">Uniform</Option>
                <Option value="triangular">Triangular</Option>
                <Option value="quadratic">Quadratic</Option>
                <Option value="gaussian">Gaussian</Option>
                <Option value="sigmoid">Sigmoid</Option>
                <Option value="cosine">Cosine</Option>
              </Select>
              <div className="bandwidth-slider-label">
                <Text strong>Bandwidth</Text>
                <Text>{this.state.bandwidth.toFixed(1)}</Text>
              </div>
              <div className="bandwidth-slider">
                <Slider
                  disabled={!this.state.showDensity}
                  step={0.1}
                  min={0.1}
                  max={20}
                  tooltipVisible={false}
                  defaultValue={bandwidth}
                  onChange={(value) => {
                    this.setState({bandwidth: value});
                  }}
                />
              </div>
            </div>
          }
        >
          <EllipsisOutlined className="settings-icon" />
        </Popover>
        <div className="hist-content">
          <Title level={3} className="hist-title">
            {this.props.title}
          </Title>
          <Text className="axis-title y">
            {yAxis.title}{' '}
            <Text className="axis-title-unit">
              {yAxis.units && `(${yAxis.units})`}
            </Text>
          </Text>
          <div className="hist" ref={this.ref} />
          <div className="empty-corner" />
          <Text className="axis-title x">
            {xAxis.title}{' '}
            <Text className="axis-title-unit">
              {xAxis.units && `(${xAxis.units})`}
            </Text>
          </Text>
        </div>
      </div>
    );
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    // Try to minimize histogram redraws based on what changed.
    if (prevProps.data !== this.props.data) {
      this.initializeHistogram();
    } else if (
      prevState.hist !== this.state.hist ||
      prevState.showHistogram !== this.state.showHistogram
    ) {
      this.drawHistogram();
    } else if (
      prevProps.points !== this.props.points &&
      this.state.showPoints
    ) {
      // If the points changed, toggle showPoints off and on again.
      // Ultimately, this results in two calls to updateDensity, over which the points disappear
      // then reappear at their new locations. (much nicer than watching them fly to new positions.)
      this.setState({showPoints: false}, () =>
        setTimeout(() => this.setState({showPoints: true}), 300)
      );
    } else if (prevState !== this.state) {
      this.updateDensity();
    }
  }
}

Histogram.defaultProps = {
  data: {},
  cutoff: null,
  padding: 30,
  width: 660,
  height: 400,
  maxWidth: 800,
  minWidth: 400,
  defaultBandwidth: 2,
  defaultKernel: 'quadratic',
  xAxis: {},
  yAxis: {},
  title: null,
  className: null,
  points: null,
  discreteQuantile: false,
  percentilePrecision: 0,
  pointsAccessor: (x) => x,
  showHistogram: true,
  showDensity: true,
  showPoints: true,
  showMean: true,
  ascending: true,
};

export default Histogram;
