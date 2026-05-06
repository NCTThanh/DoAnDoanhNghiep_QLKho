import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Input, Button, Table, InputNumber, message, Card, Row, Col, DatePicker, Divider, Spin, Alert } from 'antd';
import { CheckOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useParams } from 'react-router-dom';
import 'antd/dist/reset.css';

const API_URL = 'http://localhost:5000/api';

export default function ReceivePurchaseOrder() {
  const { id } = useParams();
  const [form] = Form.useForm();
  const [po, setPO] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [receivedQtys, setReceivedQtys] = useState({});
  const [paymentAmount, setPaymentAmount] = useState(0);

  useEffect(() => {
    fetchPODetails();
  }, [id]);

  const fetchPODetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/purchase-orders/${id}`);
      setPO(response.data.data);
      
      // Khởi tạo receivedQtys = quantity (mặc định)
      const qtys = {};
      response.data.data.details.forEach(detail => {
        qtys[detail.id] = detail.quantity;
      });
      setReceivedQtys(qtys);
    } catch (error) {
      message.error('Lỗi tải PO: ' + error.message);
    }
    setLoading(false);
  };

  if (loading) return <Spin />;

  if (!po) return <div>Không tìm thấy phiếu nhập</div>;

  // Only allow receiving when PO is in 'pending' status
  if (po.status !== 'pending') {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="Lỗi"
          description="Phiếu nhập phải ở trạng thái 'Chờ nhập' (Pending) để nhập hàng"
          type="error"
          showIcon
        />
        <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
          Quay lại
        </Button>
      </div>
    );
  }

  // Cột bảng
  const columns = [
    { title: 'Mã SP', dataIndex: 'product_code', key: 'product_code', width: 100 },
    { title: 'Tên SP', dataIndex: 'product_name', key: 'product_name', ellipsis: true },
    { title: 'ĐVT', dataIndex: 'unit', key: 'unit', width: 80 },
    {
      title: 'SL Đặt',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      render: (v) => <strong>{v}</strong>,
    },
    {
      title: 'Giá Nhập',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 100,
      render: (v) => parseFloat(v).toLocaleString('vi-VN'),
    },
    {
      title: 'SL Thực Nhập',
      key: 'received_qty',
      width: 120,
      render: (_, record) => (
        <InputNumber
          value={receivedQtys[record.id] || 0}
          onChange={(value) => setReceivedQtys({ ...receivedQtys, [record.id]: value })}
          min={0}
          precision={0}
          style={{ width: '100%' }}
        />
      ),
    },
  ];

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const details = po.details.map(detail => ({
        po_detail_id: detail.id,
        received_quantity: receivedQtys[detail.id] || 0,
      }));

      await axios.put(`${API_URL}/purchase-orders/${id}/receive`, {
        actual_delivery_date: form.getFieldValue('actual_delivery_date').format('YYYY-MM-DD'),
        details,
        payment_amount: Number(paymentAmount) || 0,
      });

      message.success('Nhập hàng thành công!');
      setTimeout(() => {
        window.location.href = '/purchase-orders';
      }, 1000);
    } catch (error) {
      message.error('Lỗi: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      <Card title={`Nhập Hàng - ${po.po_code}`} style={{ maxWidth: '100%' }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            actual_delivery_date: dayjs(),
          }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item label="Mã PO">
                <Input value={po.po_code} disabled />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="NCC">
                <Input value={po.supplier_name} disabled />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Ngày Nhập Thực Tế"
                name="actual_delivery_date"
                rules={[{ required: true }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Chi Tiết Hàng Hóa</Divider>

          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col xs={24} sm={12}>
              <Form.Item label="Thanh toán cho NCC">
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/\D/g, '')}
                  value={paymentAmount}
                  onChange={(val) => setPaymentAmount(val)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Còn nợ">
                <Input value={((Number(po.remaining_amount) - (paymentAmount || 0)) >= 0 ? (Number(po.remaining_amount) - (paymentAmount || 0)) : 0).toLocaleString('vi-VN') + ' ₫'} disabled />
              </Form.Item>
            </Col>
          </Row>

          <Alert
            message="Lưu ý: Nhập số lượng thực tế nhập hàng. Nếu khác với số lượng đặt, hệ thống sẽ ghi lại số lượng thực."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Table
            columns={columns}
            dataSource={po.details}
            pagination={false}
            rowKey="id"
            size="small"
          />

          <Row gutter={16} style={{ marginTop: 24 }}>
            <Col xs={24} sm={12}>
              <Button
                block
                onClick={() => window.history.back()}
                icon={<ArrowLeftOutlined />}
              >
                Quay Lại
              </Button>
            </Col>
            <Col xs={24} sm={12}>
              <Button
                type="primary"
                block
                icon={<CheckOutlined />}
                loading={submitting}
                onClick={handleSubmit}
              >
                Xác Nhận Nhập Hàng
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
}
