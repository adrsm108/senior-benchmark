import {classConcat, mapLength, mean} from './utils';
import React from 'react';
import './ScoreTable.less';

function formatDelta(delta, prec) {
  return typeof delta !== 'number' || Number.isNaN(delta) ? (
    <td className="delta" />
  ) : (
    <td
      className={classConcat(
        'delta',
        delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'zero'
      )}
    >
      {(delta >= 0 ? '+' : '-') + Math.abs(delta).toFixed(prec)}
    </td>
  );
}

export function ScoreTable(props) {
  const {data, rounds, precision: prec} = props;
  const xbar = mean(data);
  return (
    <div className="ScoreTable">
      <table>
        <thead>
          <tr>
            <th>ROUND</th>
            <th>TIME (ms)</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {mapLength(rounds, (i) =>
            i < data.length ? (
              <tr key={i + 1}>
                <td>{i + 1}</td>
                <td>{data[i].toFixed(prec)}</td>
                {formatDelta(
                  // when only one data point, delta is NaN, and formatDelta returns empty tag.
                  i === data.length - 1 && data[i] - data[i - 1]
                )}
              </tr>
            ) : (
              <tr key={i + 1}>
                <td>{i + 1}</td>
                <td />
                <td />
              </tr>
            )
          )}
        </tbody>
        <tfoot>
          <tr>
            <td />
            <td>{xbar.toFixed(Math.min(2, prec + 2)) /* mean */}</td>
            {formatDelta(
              // change in mean from last round
              (data[data.length - 1] - xbar) / (data.length - 1),
              Math.min(2, prec + 2)
            )}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

ScoreTable.defaultProps = {
  data: [],
  rounds: 5,
  precision: 2,
};
