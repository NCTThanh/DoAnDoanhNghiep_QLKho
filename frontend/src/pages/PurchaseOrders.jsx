import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Space, message, Tag, Select, Input, Row, Col, Modal, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, FileTextOutlined } from '@ant-design/icons';
import 'antd/dist/reset.css';

const API_URL = 'http://localhost:5000/api';

export default function PurchaseOrders() {
  const [pos, setPos] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [search, setSearch] = useState('');
  const [detailModal, setDetailModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);

  // Lấy danh sách PO
  const fetchPOs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      if (supplierId) params.supplier_id = supplierId;
      if (search) params.search = search;

      const response = await axios.get(`${API_URL}/purchase-orders`, { params });
      setPos(response.data.data || []);
    } catch (error) {
      message.error('Lỗi tải danh sách PO: ' + error.message);
    }
    setLoading(false);
  };

  // Lấy danh sách NCC
  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(`${API_URL}/suppliers?status=active`);
      setSuppliers(response.data.data || []);
    } catch (error) {
      console.error('Lỗi tải NCC:', error);
    }
  };

  useEffect(() => {
    fetchPOs();
    fetchSuppliers();
  }, [status, supplierId]);

  // Cột hiển thị
  const columns = [
    { title: 'Mã PO', dataIndex: 'po_code', key: 'po_code', width: 100, sorter: (a, b) => a.po_code.localeCompare(b.po_code) },
    { title: 'NCC', dataIndex: 'supplier_name', key: 'supplier_name', width: 150 },
    { 
      title: 'Ngày lập', 
      dataIndex: 'po_date', 
      key: 'po_date', 
      width: 100,
      render: (date) => new Date(date).toLocaleDateString('vi-VN')
    },
    { 
      title: 'Tổng tiền', 
      dataIndex: 'total_amount', 
      key: 'total_amount', 
      width: 120,
      render: (amount) => parseFloat(amount).toLocaleString('vi-VN') + ' ₫'
    },
    { 
      title: 'Đã trả', 
      dataIndex: 'paid_amount', 
      key: 'paid_amount', 
      width: 120,
      render: (amount) => parseFloat(amount).toLocaleString('vi-VN') + ' ₫'
    },
    {
      title: 'Còn nợ',
      dataIndex: 'remaining_amount',
      key: 'remaining_amount',
      width: 120,
      render: (amount) => (
        <span style={{ color: amount > 0 ? '#ff4d4f' : '#52c41a', fontWeight: 'bold' }}>
          {parseFloat(amount).toLocaleString('vi-VN')} ₫
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status) => {
        const colors = { draft: 'orange', pending: 'blue', completed: 'green', cancelled: 'red' };
        const labels = { draft: 'Nháp', pending: 'Chờ nhập', completed: 'Hoàn thành', cancelled: 'Hủy' };
        return <Tag color={colors[status]}>{labels[status] || status}</Tag>;
      },
    },
    {
      title: 'Số mặt hàng',
      dataIndex: 'item_count',
      key: 'item_count',
      width: 100,
      align: 'center',
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 250,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => showDetail(record)}
          >
            Chi tiết
          </Button>
          {record.status === 'draft' && (
            <>
              <Button size="small" icon={<EditOutlined />} onClick={() => window.location.href = `/create-purchase-order?id=${record.id}`}>
                Sửa
              </Button>
              <Button size="small" onClick={() => handleConfirm(record.id)}>
                Gửi NCC
              </Button>
              <Popconfirm title="Xóa?" onConfirm={() => handleDelete(record.id)}>
                <Button danger size="small" icon={<DeleteOutlined />}>
                  Xóa
                </Button>
              </Popconfirm>
            </>
          )}
          {record.status === 'pending' && (
            <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleReceive(record.id)}>
              Nhập hàng
            </Button>
          )}
          {record.status === 'completed' && (
            <Button size="small" type="default" onClick={() => window.location.href = `/return-purchase-order/${record.id}`}>
              Hoàn trả
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const showDetail = (record) => {
    // Fetch full PO details from API before showing modal
    (async () => {
      try {
        const response = await axios.get(`${API_URL}/purchase-orders/${record.id}`);
        setSelectedPO(response.data.data || record);
        setDetailModal(true);
      } catch (err) {
        message.error('Lỗi tải chi tiết PO: ' + (err.response?.data?.message || err.message));
      }
    })();
  };

  const handleConfirm = async (id) => {
    try {
      await axios.put(`${API_URL}/purchase-orders/${id}/confirm`);
      message.success('Xác nhận PO thành công');
      fetchPOs();
    } catch (error) {
      message.error('Lỗi: ' + error.message);
    }
  };

  const handleReceive = (id) => {
    // Chuyển đến trang nhập hàng
    window.location.href = `/receive-purchase-order/${id}`;
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/purchase-orders/${id}`);
      message.success('Xóa PO thành công');
      fetchPOs();
    } catch (error) {
      message.error('Lỗi: ' + error.message);
    }
  };

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 16 }}>
        <h2>Quản Lý Phiếu Nhập Hàng</h2>
      </div>

      {/* Bộ lọc */}
      <div style={{ background: '#fff', padding: 16, marginBottom: 16, borderRadius: 8 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Input.Search
              placeholder="Tìm mã PO hoặc NCC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onSearch={() => fetchPOs()}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Lọc theo trạng thái"
              value={status}
              onChange={setStatus}
              allowClear
              style={{ width: '100%' }}
            >
              <Select.Option value="draft">Nháp</Select.Option>
              <Select.Option value="confirmed">Xác nhận</Select.Option>
              <Select.Option value="received">Đã nhập</Select.Option>
              <Select.Option value="cancelled">Hủy</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Chọn NCC"
              value={supplierId}
              onChange={setSupplierId}
              allowClear
              style={{ width: '100%' }}
            >
              {suppliers.map((s) => (
                <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Button
              type="primary"
              block
              icon={<PlusOutlined />}
              onClick={() => (window.location.href = '/create-purchase-order')}
            >
              Tạo PO Mới
            </Button>
          </Col>
        </Row>
      </div>

      <Table
        columns={columns}
        dataSource={pos}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10, showSizeChanger: true }}
        style={{ background: '#fff', borderRadius: 8 }}
        scroll={{ x: 1400 }}
      />

      {/* Modal chi tiết */}
      <Modal
        title={`Chi Tiết PO: ${selectedPO?.po_code}`}
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={null}
        width={700}
      >
        {selectedPO && (
          <div>
            <Table
              columns={[
                { title: 'Mã SP', dataIndex: 'product_code', key: 'product_code' },
                { title: 'Tên SP', dataIndex: 'product_name', key: 'product_name' },
                { title: 'Đơn vị', dataIndex: 'unit', key: 'unit' },
                { title: 'SL', dataIndex: 'quantity', key: 'quantity' },
                { title: 'Giá', dataIndex: 'unit_price', key: 'unit_price' },
                { title: 'Tổng', dataIndex: 'total_price', key: 'total_price', render: (v) => parseFloat(v).toLocaleString('vi-VN') },
              ]}
              dataSource={selectedPO.details || []}
              pagination={false}
              rowKey="id"
              size="small"
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
