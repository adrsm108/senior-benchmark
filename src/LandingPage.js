import React from 'react';
import {Space} from 'antd';
import {Link} from 'react-router-dom';

function LandingPage(props) {
  return (
    <div className="ReactionTimeTest">
      <Space direction="vertical" size="large">
        <Link to="/reaction-time" >Reaction Time Test</Link>
        <Link to="/aim-test">Aim Test</Link>
      </Space>
    </div>
  );
}

export default LandingPage;