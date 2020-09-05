import React from 'react';
import {Card, Statistic, Typography} from 'antd';
import * as d3 from 'd3';
import './UserPage.less';

const {Title} = Typography;

function UserPage(props) {
  const {session} = props;
  const [data, setData] = React.useState({});
  fetch('/api/user-page')
    .then((response) => response.json())
    .then((data) => {
      setData(data);
    })
    .catch((error) => {
      console.error(error);
    });

  const {reactionTime, aimTest, numberMemory} = data;
  return (
    <div className="UserPage">
      <Title className="page-title">User {session.username}</Title>
      {reactionTime && (
        <>
          <Card className="stats-card reaction-time" title="Reaction Time">
            <Statistic
              title="Mean Time (Overall)"
              precision={2}
              suffix='ms'
              value={
                d3.sum(
                  reactionTime.flatMap((d) => [
                    d.t1,
                    d.t2,
                    d.t3,
                    d.t4,
                    d.t5,
                  ])
                ) /
                (reactionTime.length * 5)
              }
            />
            <Statistic
              title="Best Mean Time"
              precision={2}
              suffix='ms'
              value={d3.min(reactionTime, (d) => d.t_avg)}
            />
          </Card>
        </>
      )}
      {aimTest && (
        <>
          <Card className="stats-card aim-test" title="Aim Test">
            <Statistic
              title="Mean Time (Overall)"
              precision={2}
              suffix='ms'
              value={
                d3.sum(aimTest, d => d.mean_time * d.rounds) / d3.sum(aimTest, d => d.rounds)
              }
            />
            <Statistic
              title="Best Mean Time"
              precision={2}
              suffix={'ms'}
              value={d3.min(aimTest, (d) => d.mean_time)}
            />
          </Card>
        </>
      )}
      {numberMemory && (
        <>
          <Card className="stats-card number-memory" title="Number Memory">
            <Statistic
              title="Mean Score (Overall)"
              precision={0}
              suffix='digits'
              value={
                d3.mean(numberMemory, d => d.max_round)
              }
            />
            <Statistic
              title="Best Score"
              precision={0}
              suffix='digits'
              value={d3.max(numberMemory, (d) => d.max_round)}
            />
          </Card>
        </>
      )}
    </div>
  );
}

export default UserPage;
