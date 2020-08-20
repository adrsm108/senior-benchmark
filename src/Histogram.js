import React, {Component} from 'react';
import * as d3 from 'd3';
import {binnedKDE, classConcat, identity, last} from './utils';
import {Card, Popover, Select, Slider, Switch, Typography} from 'antd';
import {EllipsisOutlined} from '@ant-design/icons';
import './Histogram.less';

const {Option} = Select;
const {Title, Text} = Typography;

function spaceData(data, totalLength, indexKey, valueKey, defaultValue = 0) {
  const spacedData = new Array(totalLength).fill(defaultValue);

  for (const {[indexKey]: idx, [valueKey]: datum} of data) {
    if (idx < totalLength) spacedData[idx] = datum;
  }

  return spacedData;
}

class Histogram extends Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
    this.state = {
      showHistogram: true,
      showDensity: true,
      showPoints: true,
      kernel: props.defaultKernel,
      bandwidth: props.defaultBandwidth,
    };
  }

  initializeHistogram = () => {
    const {padding, width, height} = this.props;
    // if (typeof padding === 'number') {
    //   padding = {top: padding, bottom: padding, left: padding, right: padding};
    // }
    const innerWidth = width - (padding.left + padding.right || 2 * padding);
    const innerHeight = height - (padding.top + padding.bottom || 2 * padding);
    const {
      globalSummary: {q1, q3},
      histogram: {binStart, binWidth, data: rawData},
    } = this.props.data;

    const cutoff = q3 + 2 * (q3 - q1);
    const bins = Math.ceil((cutoff - binStart) / binWidth);
    // const data = spaceData(rawData, bins, 'bin', 'freq', 0);

    const data = new Array(bins).fill(0);
    for (const {bin, freq} of rawData) if (bin < bins) data[bin] = freq;
    let tot = 0;
    const cumData = [0, ...data.map((freq) => (tot += freq))];

    // const quantileInterpolator = d3.interpolateBasis(cumData);
    const quantile = d3
      .scaleLinear()
      .domain([...cumData.keys(), last(rawData).bin])
      .range([...cumData, 1])
      .clamp(true);

    // const quantileInterpolator = d3.piecewise(d3.interpolateNumber, cumData);
    // const clen = cumData.length;
    // shift right by 1/2 an index ( the result of shifting 1 right to account for control point, then left 1/2 to center with bin)
    // const quantileInterpolate = (t, tMax) => quantileInterpolator(t / tMax);

    const yScale = d3
      .scaleLinear()
      .domain([0, data.reduce((a, x) => Math.max(a, x))])
      .range([innerHeight, 0]);

    // scale bin index to milliseconds
    const xScaleMs = d3
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
        xScaleMs,
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
          .y1(yScale),
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

          const annotation = g
            .selectAll('text')
            .data([null])
            .join('text')
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

          const {y, width: w} = annotation.node().getBBox();
          annotation.attr('transform', `translate(${-w / 2},${y - 15})`);
        },
      },
    });
  };

  drawHistogram = () => {
    const {
      innerWidth,
      innerHeight,
      xScale,
      xScaleMs,
      yScale,
      data,
      appear,
      appearEase,
      disappear,
      disappearEase,
    } = this.state.hist;

    const padding = this.props.padding;

    const histSel = d3.select(this.ref.current);
    // histSel.selectAll('svg').remove();

    const rootSvg = histSel
      .selectAll('svg.root-svg')
      .data([null])
      .join('svg')
      .attr('class', 'root-svg')
      .attr('width', this.props.width)
      .attr('height', this.props.height);

    rootSvg
      .selectAll('defs')
      .data([null])
      .join('defs')
      .append('clipPath')
      .attr('id', 'rect-clip')
      .append('rect')
      .attr('x', 0)
      .attr('y', -(padding.top || padding))
      .attr('width', innerWidth)
      .attr('height', innerHeight + (padding.top || padding));

    const root = rootSvg
      .selectAll('g.root-transform')
      .data([null])
      .join('g')
      .attr('class', 'root-transform')
      .attr(
        'transform',
        `translate(${padding.left || padding},${padding.top || padding})`
      );

    // Draw axes
    root
      .selectAll('g.x-axis')
      .data([null])
      .join('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat((x) => xScaleMs(x).toFixed()))
      .selectAll('text')
      .attr('transform', 'translate(-10, 0) rotate(-45)')
      .attr('class', 'x-axis-text');

    root
      .selectAll('g.y-axis')
      .data([null])
      .join('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .attr('class', 'y-axis-text');

    //TODO: axis labels

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
        xScaleMs,
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
    } = this.state;
    const {points, padding} = this.props;

    const pointData =
      points && showPoints ? [points.mean, ...points.times] : [];

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
      .data(showDensity ? pointData.map(xScaleMs.invert) : [])
      .join(
        (enter) =>
          enter
            .append('circle')
            .attr('class', (_, i) => classConcat('query-point', !i && 'mean'))
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
                .attr('r', (_, i) => (i ? 3 : 4))
            ),
        (update) =>
          update.call((update) =>
            update
              .transition(densityTransitionChange)
              .attr('cy', interpY)
              .attr('cx', xScale)
              .attr('r', (_, i) => (i ? 3 : 4))
          ),
        (exit) =>
          exit.call((exit) =>
            exit
              .transition(disappear)
              .ease(disappearEase)
              // .attr('cy', yScale(0))
              // .delay((_, i) => i * 25)
              .attr('r', 0)
              .remove()
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
      .attr('y', -(padding.top || padding))
      .attr('height', innerHeight + (padding.top || padding))
      .on('touchmove mousemove', function () {
        const mx = d3.mouse(densityAreaNode)[0];
        const areaWidth = densityAreaNode.getBBox().width;
        const px = mx / areaWidth;
        const x = (mx / areaWidth) * dlen;
        const y = interp(px + shift);
        tooltip
          .attr('transform', `translate(${mx},${yScale(y)})`)
          .call(
            callout,
            `${xScaleMs(x).toFixed(2)}ms\n${(100 * (1 - quantile(x))).toFixed(
              2
            )}th percentile`,
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
    return (
      <Card title={null} className={classConcat('Histogram', this.props.className)}>
        <Popover
          trigger="click"
          placement="rightTop"
          content={
            <div className="settings-content">
              <div className="title-and-switch">
                <Title level={4}>Histogram</Title>
                <Switch
                  defaultChecked
                  onChange={(value) => this.setState({showHistogram: value})}
                />
              </div>
              <div className="title-and-switch">
                <Title level={4}>Density</Title>
                <Switch
                  defaultChecked
                  onChange={(value) => this.setState({showDensity: value})}
                />
              </div>
              <div className="title-and-switch">
                <Title level={4}>Points</Title>
                <Switch
                  defaultChecked
                  disabled={!this.state.showDensity}
                  onChange={(value) => this.setState({showPoints: value})}
                />
              </div>
              <Text strong>Kernel</Text>
              <Select
                disabled={!this.state.showDensity}
                defaultValue={this.state.kernel}
                onChange={(value) =>
                  this.setState({kernel: value}, this.updateDensity)
                }
              >
                <Option value="uniform"> Uniform</Option>
                <Option value="triangular">Triangular</Option>
                <Option value="quadratic"> Quadratic</Option>
                <Option value="gaussian"> Gaussian</Option>
                <Option value="sigmoid"> Sigmoid</Option>
                <Option value="cosine"> Cosine</Option>
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
                  defaultValue={this.state.bandwidth}
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
        {this.props.title !== null && <Title className="histogram-title" level={3}>{this.props.title}</Title>}
        <div className="plot-area" ref={this.ref} />
      </Card>
    );
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const fn = () => setTimeout(() => this.setState({showPoints: true}), 300);
    if (prevProps.data !== this.props.data) {
      this.initializeHistogram();
    } else if (prevState !== this.state) {
      if (
        prevState.hist !== this.state.hist ||
        prevState.showHistogram !== this.state.showHistogram
      ) {
        this.drawHistogram();
      } else if (
        prevProps.points !== this.props.points &&
        this.state.showPoints
      ) {
        this.setState({showPoints: false, revealPoints: true}, fn);
      } else {
        this.updateDensity();
      }
    } else if (
      prevProps.points !== this.props.points &&
      this.state.showPoints
    ) {
      this.setState({showPoints: false, revealPoints: true}, fn);
    }
  }
  /*
      Object.keys(this.props.data).forEach((key) => {
        console.log(
          key,
          this.props.data[key] !== prevProps.data[key] ? ' not equal' : ' equal'
        );
      });
    } else {
      console.log('data equal');
    }
    this.drawHistogram();
 
 * */
}

Histogram.defaultProps = {
  data: {},
  padding: {top: 30, right: 30, bottom: 70, left: 60},
  width: 660,
  height: 400,
  defaultBandwidth: 2,
  defaultKernel: 'quadratic',
  title: null,
  className: null,
};

export default Histogram;
