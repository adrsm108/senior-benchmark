import React from 'react';
import './FormModals.less';
import {LockOutlined, UserOutlined} from '@ant-design/icons';
import {Divider, Form, Input, Modal, Typography} from 'antd';
import {classConcat} from './utils';

const {Password} = Input;
const {Text, Link} = Typography;

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

const submitTo = (route, form, setLoading, callback) => () => {
  form
    .validateFields()
    .then((values) => {
      setLoading(true);
      fetch(route, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(values),
      })
        .then((response) => {
          setLoading(false);
          if (response.ok) {
            console.log('response ok');
            response
              .json()
              .then((data) => {
                console.log(data);
                callback(data);
              })
              .catch((error) => console.error(error));
          } else {
            console.error('Got bad response:', response);
          }
        })
        .catch((error) => {
          console.error(error);
        });
    })
    .catch((info) => {
      console.log('Validation failed:', info);
    });
};

export function LoginModal(props) {
  const {
    labelSpan,
    wrapperSpan,
    className,
    title,
    afterFinish,
    ...rest
  } = props;
  const layout = formItemLayout(5);
  // const tailLayout = tailFormItemLayout(5);
  const [loading, setLoading] = React.useState(false);
  const [form] = Form.useForm();
  // const history = useHistory();

  return (
    <Modal
      {...rest}
      className={classConcat('LoginModal', className)}
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
      confirmLoading={loading}
      okText="Login"
      onOk={submitTo('/auth', form, setLoading, (v) => {
        afterFinish(v);
        props.onCancel();
      })}
    >
      <Form
        form={form}
        {...layout}
        scrollToFirstError
        hideRequiredMark
        layout="horizontal"
        name="Login"
      >
        <Form.Item
          label="Username"
          name="username"
          rules={[{required: true, message: 'Please provide a username.'}]}
        >
          <Input
            prefix={<UserOutlined className="site-form-item-icon" />}
            placeholder="Username"
          />
        </Form.Item>
        <Form.Item
          label="Password"
          name="password"
          className="password-item"
          rules={[{required: true, message: 'Please provide a password.'}]}
        >
          <Password
            prefix={<LockOutlined className="site-form-item-icon" />}
            placeholder="Password"
          />
        </Form.Item>
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
  const {
    labelSpan,
    wrapperSpan,
    className,
    title,
    afterFinish,
    ...rest
  } = props;
  const layout = formItemLayout(7);
  // const tailLayout = tailFormItemLayout(7);
  const [loading, setLoading] = React.useState(false);
  const [form] = Form.useForm();

  return (
    <Modal
      {...rest}
      className={classConcat('RegisterModal', className)}
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
      confirmLoading={loading}
      okText="Login"
      onOk={submitTo('/register', form, setLoading, (v) => {
        afterFinish(v);
        props.onCancel();
      })}
    >
      <Form
        form={form}
        {...layout}
        scrollToFirstError
        hideRequiredMark
        layout="horizontal"
        name="Register"
      >
        <Form.Item
          label="Username"
          name="username"
          rules={[{required: true, message: 'Please provide a username.'}]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Password"
          name="password"
          className="password-item"
          rules={[{required: true, message: 'Please provide a password.'}]}
        >
          <Password />
        </Form.Item>
        <Form.Item
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
        </Form.Item>
      </Form>
    </Modal>
  );
}

RegisterModal.defaultProps = {
  ...Modal.defaultProps,
  onClickHeaderLink: () => null,
  title: 'Register',
};
