import React from 'react';
import {Space, Typography} from 'antd';
import {Link} from 'react-router-dom';

const {Title} = Typography;

function LandingPage(props) {
  return (
    <div className="ReactionTimeTest">
      <Space direction="vertical" size="large" align="center">
        <Title className="page-title">WELCOME TO OUR WEBPAGE!</Title>
        <Link to="/reaction-time">Reaction Time Test</Link>
        <Link to="/aim-test">Aim Test</Link>
        <Link to="/number-memory">Number Memory</Link>
      </Space>
    </div>
  );
}

export default LandingPage;
