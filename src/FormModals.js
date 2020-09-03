import React, {Component} from 'react';
import './FormModals.less';
import {UserOutlined, LockOutlined} from '@ant-design/icons';
import {Form, Input, Checkbox, Button, Typography, Modal, Divider} from 'antd';
// import Login from './Login';
import {classConcat} from './utils';

const {Item} = Form;
const {Password} = Input;
const {Title, Text, Link} = Typography;

const formItemLayout = (labelspan) => ({
  labelCol: {
    xs: {span: 24},
    sm: {span: labelspan},
  },
  wrapperCol: {
    xs: {span: 24},
    sm: {span: 24 - labelspan},
  },
});
const tailFormItemLayout = (labelspan) => ({
  wrapperCol: {
    xs: {span: 24, offset: 0},
    sm: {span: 24 - labelspan, offset: labelspan},
  },
});

export function LoginModal(props) {
  const {labelSpan, wrapperSpan, className, title, ...rest} = props;
  const layout = formItemLayout(5);
  const tailLayout = tailFormItemLayout(5);
  return (
    <Modal
      className={classConcat('LoginModal', className)}
      {...rest}
      title={
        <>
          <Text>{title}</Text>
          <Divider type="vertical" className="title-divider" />
          <Text className="header-message">
            No account?{' '}
            <Link className="header-link" onClick={props.onClickHeaderLink}>
              Register now!
            </Link>
          </Text>
        </>
      }
      footer={[
        <Button key="sub" form="Login" type="primary" htmlType="submit">
          Login
        </Button>,
      ]}
    >
      <Form
        {...layout}
        hideRequiredMark
        layout="horizontal"
        name="Login"
        onFinish={props.onFinish}
        onFinishFailed={props.onFinishFailed}
      >
        <Item
          label="Username"
          name="username"
          rules={[{required: true, message: 'Please provide a username.'}]}
        >
          <Input
            prefix={<UserOutlined className="site-form-item-icon" />}
            placeholder="Username"
          />
        </Item>
        <Item
          label="Password"
          name="password"
          className="password-item"
          rules={[{required: true, message: 'Please provide a password.'}]}
        >
          <Password
            prefix={<LockOutlined className="site-form-item-icon" />}
            placeholder="Password"
          />
        </Item>
        <Item
          {...tailLayout}
          className="checkbox-item"
          name="remember"
          valuePropName="checked"
        >
          <Checkbox defaultChecked={true}>Remember me</Checkbox>
        </Item>
      </Form>
    </Modal>
  );
}
LoginModal.defaultProps = {
  ...Modal.defaultProps,
  onClickHeaderLink: () => null,
  title: 'Login',
};

export function RegisterModal(props) {
  const {labelSpan, wrapperSpan, className, title, ...rest} = props;

  const layout = formItemLayout(7);
  const tailLayout = tailFormItemLayout(7);

  return (
    <Modal
      className={classConcat('RegisterModal', className)}
      {...rest}
      title={
        <>
          <Text>{title}</Text>
          <Divider type="vertical" className="title-divider" />
          <Text className="header-message">
            Already have an account?{' '}
            <Link className="header-link" onClick={props.onClickHeaderLink}>
              Login here!
            </Link>
          </Text>
        </>
      }
      footer={[
        <Button key="sub" form="Register" type="primary" htmlType="submit">
          Register
        </Button>,
      ]}
    >
      <Form
        {...layout}
        scrollToFirstError
        hideRequiredMark
        layout="horizontal"
        name="Register"
        onFinish={props.onFinish}
        onFinishFailed={props.onFinishFailed}
      >
        <Item
          label="Username"
          name="username"
          rules={[{required: true, message: 'Please provide a username.'}]}
        >
          <Input />
        </Item>
        <Item
          label="Password"
          name="password"
          className="password-item"
          rules={[{required: true, message: 'Please provide a password.'}]}
        >
          <Password />
        </Item>
        <Item
          name="confirm"
          label="Confirm Password"
          dependencies={['password']}
          hasFeedback
          rules={[
            {
              required: true,
              message: 'Please confirm your password.',
            },
            ({getFieldValue}) => ({
              validator(rule, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject("The passwords you entered don't match!");
              },
            }),
          ]}
        >
          <Password />
        </Item>
        <Item
          {...tailLayout}
          className="checkbox-item"
          name="checkbox"
          valuePropName="checked"
        >
          <Checkbox defaultChecked={true}>
            This checkbox is nice for spacing.
          </Checkbox>
        </Item>
      </Form>
    </Modal>
  );
}

RegisterModal.defaultProps = {
  ...Modal.defaultProps,
  onClickHeaderLink: () => null,
  title: 'Register',
};
