import React, {Component, useEffect, useRef, useState} from 'react';
import './ClickTest.less';

const targetPath = new Path2D('M0 200 v-200 h200 a100,100 90 0,1 0,200 a100,100 90 0,1 -200,0 z');

function drawTarget(ctx, {x, y}) {
  console.log('drawing targ');
  ctx.fillStyle('red');
  ctx.translate(x, y);
  ctx.fill(targetPath);
  ctx.restore();
}

function useCanvas(width, height) {
  const canvasRef = useRef(null);
  const [pts, setPts] = useState([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    pts.forEach((pt) => {
      drawTarget(ctx, pt);
    });
  });

  return [pts, setPts, canvasRef, width, height];
}

class ClickTest extends Component {
  constructor(props) {
    super(props);
    const [pts, setPts, canvasRef, width, height] = useCanvas(props.width, props.height);
    this.canvas = {
      pts: pts,
      setPts: setPts,
      ref: canvasRef,
      width: width,
      height: height,
    };
  }

  handleCanvasClick = (event) => {
    this.canvas.setPts([...this.canvas.pts, {x: event.clientX, y: event.clientY}]);
  };

  render() {
    return (
      <div className="click-test-main">
        <canvas
          width={this.props.width}
          height={this.props.height}
          ref={this.canvas.ref}
          onClick={this.handleCanvasClick}
        />
      </div>
    );
  }
}

export default ClickTest;
