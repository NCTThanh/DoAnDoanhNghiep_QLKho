import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Input, Button, Table, InputNumber, message, Card, Row, Col, DatePicker, Divider, Spin, Alert } from 'antd';
import { UndoOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useParams } from 'react-router-dom';
import 'antd/dist/reset.css';

const API_URL = 'http://localhost:5000/api';

export default function ReturnPurchaseOrder() {
  const { id } = useParams();
  const [form] = Form.useForm();
  const [po, setPO] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [returnedQtys, setReturnedQtys] = useState({});
  const [refundAmount, setRefundAmount] = useState(0);

  useEffect(() => {
    fetchPODetails();
  }, [id]);

  const fetchPODetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/purchase-orders/${id}`);
      setPO(response.data.data);
      
      // Initialize returnedQtys to 0 (không hoàn trả mặc định)
      const qtys = {};
      response.data.data.details.forEach(detail => {
        qtys[detail.id] = 0;
      });
      setReturnedQtys(qtys);
    } catch (error) {
      message.error('Lỗi tải PO: ' + error.message);
    }
    setLoading(false);
  };

  if (loading) return <Spin />;

  if (!po) return <div>Không tìm thấy phiếu nhập</div>;

  if (po.status !== 'completed') {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="Lỗi"
          description="Chỉ có thể hoàn trả phiếu ở trạng thái 'Hoàn thành'"
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
      title: 'SL Nhập',
      dataIndex: 'received_quantity',
      key: 'received_quantity',
      width: 80,
      render: (v) => <strong>{v || 0}</strong>,
    },
    {
      title: 'Giá Nhập',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 100,
      render: (v) => parseFloat(v).toLocaleString('vi-VN'),
    },
    {
      title: 'SL Hoàn Trả',
      key: 'returned_qty',
      width: 120,
      render: (_, record) => (
        <InputNumber
          value={returnedQtys[record.id] || 0}
          onChange={(value) => {
            const maxReturn = record.received_quantity || 0;
            if (value > maxReturn) {
              message.warning(`Không thể hoàn trả quá ${maxReturn} cái`);
              return;
            }
            setReturnedQtys({ ...returnedQtys, [record.id]: value });
          }}
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
      const values = await form.validateFields();
      const { reason, refund_amount } = values;
      
      const details = po.details
        .filter(detail => (returnedQtys[detail.id] || 0) > 0)
        .map(detail => ({
          po_detail_id: detail.id,
          product_id: detail.product_id, // Gửi thêm product_id để backend xử lý nhanh hơn
          returned_quantity: returnedQtys[detail.id] || 0,
        }));

      if (details.length === 0 && (refund_amount || 0) <= 0) {
        message.error('Vui lòng nhập số lượng hoàn trả hoặc số tiền hoàn lại');
        setSubmitting(false);
        return;
      }

      await axios.put(`${API_URL}/purchase-orders/${id}/return`, {
        details,
        refund_amount: Number(refund_amount) || 0,
        reason,
      });

      message.success('Hoàn trả thành công!');
      setTimeout(() => {
        window.location.href = '/purchase-orders';
      }, 1000);
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error.message || 'Có lỗi xảy ra khi hoàn trả';
      message.error('Lỗi: ' + errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      <Card title={`Hoàn Trả - ${po.po_code}`} style={{ maxWidth: '100%' }}>
        <Form
          form={form}
          layout="vertical"
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
              <Form.Item label="Tổng tiền">
                <Input value={parseFloat(po.total_amount).toLocaleString('vi-VN') + ' ₫'} disabled />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Chi Tiết Hàng Hoàn Trả</Divider>

          <Alert
            message="Nhập số lượng hàng muốn hoàn trả. Hệ thống sẽ giảm tồn kho tương ứng."
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
              <Form.Item label="Số tiền hoàn lại" name="refund_amount">
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/\D/g, '')}
                  max={Number(po.paid_amount) || 0}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Lý do hoàn trả" name="reason">
                <Input.TextArea rows={2} placeholder="Nhập lý do hoàn trả (tùy chọn)" />
              </Form.Item>
            </Col>
          </Row>

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
                icon={<UndoOutlined />}
                loading={submitting}
                onClick={handleSubmit}
              >
                Xác Nhận Hoàn Trả
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
}
