import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { ColorPalette } from '../../utils/ColorPalette';
import { message } from 'antd';
import { Button, Col, Form, InputGroup, Modal, Row } from 'react-bootstrap';
import { changePassword } from '../../services/AuthService';
import { ChangePasswordModel } from '../../models/ChangePasswordModel';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// Define the validation schema with Yup
const getValidationSchema = (isFirstLoggedIn: boolean) => Yup.object({
    oldPassword: !isFirstLoggedIn
        ? Yup.string().notRequired()
        : Yup.string()
            .required('Old password is required'),
    newPassword: Yup.string()
        .required('New password is required')
        .matches(/^(?=.*[A-Za-z@$!%*#?&])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/, 'Password must have at least 8 characters, including letters (or special characters) and numbers')
});

interface ChangePasswordModalProps {
    show: boolean,
    isFirstLoggedIn: boolean,
    onClose: () => void
}

export const PasswordModalComponent: React.FC<ChangePasswordModalProps> = ({ show, isFirstLoggedIn, onClose }) => {
    // const [apiError, setApiError] = useState<string>('');
    const [isFirstLogIn, setIsFirstLogIn] = useState<boolean>(isFirstLoggedIn);
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [messageApi, contextHolder] = message.useMessage();
    const [showOld, setShowOld] = useState<boolean>(false);
    const [showNew, setShowNew] = useState<boolean>(false);

    const formik = useFormik({
        initialValues: {
            oldPassword: '',
            newPassword: ''
        },
        validationSchema: getValidationSchema(isFirstLoggedIn),
        onSubmit: async (values, { resetForm }) => {
            // setApiError('');
            setSuccessMessage('');

            messageApi.open({
                type: 'loading',
                content: 'Updating password...',
            }).then(async () => {
                const changePswrdData: ChangePasswordModel = {
                    oldPassword: isFirstLoggedIn != true ? '' : values.oldPassword,
                    newPassword: values.newPassword
                };

                await changePassword(changePswrdData)
                    .then((res) => {
                        console.log(res);
                        if (res.status == 200) {
                            resetForm();
                            setIsFirstLogIn(true);
                            localStorage.removeItem('isFirstLogin');
                            setSuccessMessage('Your password has been changed successfully!');
                        }
                    }).catch((err) => {
                        console.log(String(err.response.data.message));
                        message.error(String(err.response.data.message));
                    });
            });

        }
    });

    if (!show) {
        return null;
    }

    const handleCloseModal = () => {
        // setApiError('');
        setSuccessMessage('');
        formik.resetForm();
        onClose();
    };

    const handleShowOldPassword = () => {
        setShowOld(!showOld);
    };

    const handleShowNewPassword = () => {
        setShowNew(!showNew);
    };

    return (
        <Modal show={show} onHide={handleCloseModal} centered backdrop="static">
            {contextHolder}
            <Modal.Header style={{ backgroundColor: '#EEE' }}>
                <Modal.Title style={{ color: ColorPalette.PRIMARY_COLOR }}>Change password</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {!isFirstLogIn ? <p className="change-pswr-content mx-2">This is the first time you logged in. <br /> You have to change your password to continue</p> : null}
                {successMessage ? (
                    <div>
                        <div className="success-message mx-2">{successMessage}</div>
                        <Row>
                            <Col className="d-flex justify-content-end mb-3">
                                <Button
                                    id='btn-save-change-pass-success'
                                    className="btn btn-light mx-2"
                                    style={{ minWidth: "90px" }}
                                    onClick={handleCloseModal}>
                                    Close
                                </Button>
                            </Col>
                        </Row>
                    </div>
                ) : (
                    <Form onSubmit={formik.handleSubmit}>
                        {isFirstLogIn !== false && (
                            <Form.Group as={Row} className="mb-3 px-2">
                                <Form.Label column sm={4}>
                                    Old password <span className='mx-1' style={{ color: ColorPalette.PRIMARY_COLOR }}>*</span>
                                </Form.Label>
                                <Col sm={8}>
                                    <InputGroup className="password-onfocus">
                                        <Form.Control
                                            type={showOld ? 'text' : 'password'}
                                            className="form-control border-0"
                                            id="old-password"
                                            {...formik.getFieldProps('oldPassword')}
                                            aria-required
                                        />
                                        <InputGroup.Text className='bg-transparent border-0'>
                                            <FontAwesomeIcon icon={showOld ? faEye : faEyeSlash} onClick={handleShowOldPassword}></FontAwesomeIcon>
                                        </InputGroup.Text>
                                    </InputGroup>
                                    {formik.touched.oldPassword && formik.errors.oldPassword ? (
                                        <div className="error-message">{formik.errors.oldPassword}</div>
                                    ) : null}
                                </Col>
                            </Form.Group>
                        )}
                        <Form.Group as={Row} className="mb-3 px-2">
                            <Form.Label column sm={4}>
                                New password <span className='mx-1' style={{ color: ColorPalette.PRIMARY_COLOR }}>*</span>
                            </Form.Label>
                            <Col sm={8}>
                                <InputGroup className="password-onfocus">
                                    <Form.Control
                                        type={showNew ? 'text' : 'password'}
                                        className="form-control border-0"
                                        id="new-password"
                                        {...formik.getFieldProps('newPassword')}
                                        aria-required
                                    />
                                    <InputGroup.Text className='bg-transparent border-0'>
                                        <FontAwesomeIcon icon={showNew ? faEye : faEyeSlash} onClick={handleShowNewPassword}></FontAwesomeIcon>
                                    </InputGroup.Text>
                                </InputGroup>
                                {formik.touched.newPassword && formik.errors.newPassword ? (
                                    <div className="error-message">{formik.errors.newPassword}</div>
                                ) : null}
                            </Col>
                        </Form.Group>
                        <Row className="d-flex justify-content-end">
                            <Col className="d-flex justify-content-end mb-3">
                                <Button
                                    id='btn-save-change-pass'
                                    variant='danger'
                                    className="mx-2 fw-semibold"
                                    type="submit"
                                    style={{ minWidth: "90px" }}
                                    disabled={!formik.isValid || !formik.dirty}>
                                    Save
                                </Button>
                                {isFirstLogIn !== false && (
                                    <Button
                                        id='btn-cancel-change-pass'
                                        variant='outline-secondary'
                                        className="mx-2 fw-semibold"
                                        style={{ minWidth: "90px" }}
                                        onClick={handleCloseModal}>
                                        Cancel
                                    </Button>
                                )}
                            </Col>
                        </Row>
                    </Form>
                )}
            </Modal.Body>
        </Modal>
    );
};
