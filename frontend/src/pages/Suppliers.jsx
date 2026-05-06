import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Modal, Form, Input, Select, Space, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PhoneOutlined } from '@ant-design/icons';
import 'antd/dist/reset.css';

const API_URL = 'http://localhost:5000/api';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  // Lấy danh sách NCC
  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/suppliers?status=active`);
      setSuppliers(response.data.data || []);
    } catch (error) {
      message.error('Lỗi tải danh sách NCC: ' + error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Cột hiển thị
  const columns = [
    {
      title: 'Mã NCC',
      dataIndex: 'supplier_code',
      key: 'supplier_code',
      width: 100,
      sorter: (a, b) => a.supplier_code.localeCompare(b.supplier_code),
    },
    {
      title: 'Tên NCC',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: 'Điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: 'Công nợ',
      dataIndex: 'total_debt',
      key: 'total_debt',
      width: 140,
      render: (debt) => (
        <span style={{ color: debt > 0 ? '#ff4d4f' : '#52c41a', fontWeight: 'bold' }}>
          {parseFloat(debt).toLocaleString('vi-VN')} ₫
        </span>
      ),
    },
    {
      title: 'Hạn TT',
      dataIndex: 'payment_term',
      key: 'payment_term',
      width: 100,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '✓ Hoạt động' : '✗ Ngừng'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa?"
            description="Bạn có chắc chắn muốn xóa NCC này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button danger size="small" icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/suppliers/${id}`);
      message.success('Xóa NCC thành công');
      fetchSuppliers();
    } catch (error) {
      message.error('Lỗi xóa NCC: ' + error.message);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingId) {
        await axios.put(`${API_URL}/suppliers/${editingId}`, values);
        message.success('Cập nhật NCC thành công');
      } else {
        await axios.post(`${API_URL}/suppliers`, values);
        message.success('Thêm NCC thành công');
      }
      setIsModalOpen(false);
      form.resetFields();
      fetchSuppliers();
    } catch (error) {
      message.error('Lỗi lưu dữ liệu: ' + error.message);
    }
  };

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Quản Lý Nhà Cung Cấp</h2>
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleAdd}>
          Thêm NCC Mới
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={suppliers}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Tổng: ${total}` }}
        style={{ background: '#fff', borderRadius: 8 }}
        scroll={{ x: 1200 }}
      />

      <Modal
        title={editingId ? 'Sửa Nhà Cung Cấp' : 'Thêm Nhà Cung Cấp'}
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Mã NCC"
            name="supplier_code"
            rules={[{ required: true, message: 'Vui lòng nhập mã NCC' }]}
          >
            <Input placeholder="VD: NCC001" disabled={editingId !== null} />
          </Form.Item>

          <Form.Item
            label="Tên NCC"
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập tên NCC' }]}
          >
            <Input placeholder="VD: NPP Tân Tài Phát" />
          </Form.Item>

          <Form.Item label="Điện thoại" name="phone">
            <Input placeholder="VD: 0918123456" />
          </Form.Item>

          <Form.Item label="Email" name="email">
            <Input type="email" placeholder="contact@ncc.com" />
          </Form.Item>

          <Form.Item label="Địa chỉ" name="address">
            <Input.TextArea rows={2} placeholder="Nhập địa chỉ" />
          </Form.Item>

          <Form.Item label="Mã Số Thuế" name="tax_id">
            <Input placeholder="VD: 0123456789" />
          </Form.Item>

          <Form.Item label="Người Đại Diện" name="representative">
            <Input placeholder="VD: Ông Tài" />
          </Form.Item>

          <Form.Item label="Hạn Thanh Toán" name="payment_term">
            <Select placeholder="Chọn hạn thanh toán">
              <Select.Option value="COD">COD (Trả khi nhận)</Select.Option>
              <Select.Option value="30 ngày">30 ngày</Select.Option>
              <Select.Option value="60 ngày">60 ngày</Select.Option>
              <Select.Option value="90 ngày">90 ngày</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Trạng thái"
            name="status"
            initialValue="active"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="active">Hoạt động</Select.Option>
              <Select.Option value="inactive">Ngừng</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
