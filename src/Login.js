import React, {Component} from 'react';
// import './FormModals.less';
import {Form, Input, Button, Typography, Card, Space} from 'antd';
import {LoginModal, RegisterModal} from './FormModals';
const {Item} = Form;
const {Password} = Input;
const {Title} = Typography;

class Login extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showLogin: false,
      showRegister: false,
    };
  }
  // handleFinish = (values) => console.log('success:', values);
  // handleFinishFailed = (error) => console.log('error: ', error);
  //
  render() {
    return (
      <div>
        <Space>
          <Button
            onClick={() =>
              this.setState((state) => ({
                showLogin: !state.showLogin,
              }))
            }
          >
            Show Login
          </Button>

          <Button
            onClick={() =>
              this.setState((state) => ({
                showRegister: !state.showRegister,
              }))
            }
          >
            Show Register
          </Button>
        </Space>
        <LoginModal
          visible={this.state.showLogin}
          onCancel={() => this.setState({showLogin: false})}
        />
        <RegisterModal
          visible={this.state.showRegister}
          onCancel={() => this.setState({showRegister: false})}
        />
      </div>
    );
  }
}

export default Login;
