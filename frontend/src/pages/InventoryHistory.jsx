import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Select, Button, Table, DatePicker, Row, Col, Card, Space, Tag, Empty, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'antd/dist/reset.css';

const API_URL = 'http://localhost:5000/api';

export default function InventoryHistory() {
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [transactionType, setTransactionType] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
    handleSearch();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products`);
      setProducts(response.data.data || []);
    } catch (error) {
      console.error('Lỗi tải sản phẩm:', error);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = {};
      if (currentProduct) params.product_id = currentProduct;
      if (transactionType) params.transaction_type = transactionType;
      if (startDate) params.start_date = startDate.format('YYYY-MM-DD');
      if (endDate) params.end_date = endDate.format('YYYY-MM-DD');

      const response = await axios.get(`${API_URL}/inventory-log`, { params });
      setHistory(response.data.data || []);
    } catch (error) {
      console.error('Lỗi tải lịch sử:', error);
      message.error(error?.response?.data?.message || 'Không tải được lịch sử kho');
    }
    setLoading(false);
  };

  // Mapping transaction types
  const transactionTypeMap = {
    'import_purchase_order': { label: 'Nhập từ PO', color: 'green' },
    'export_sales': { label: 'Bán hàng', color: 'blue' },
    'export_return': { label: 'Trả hàng', color: 'orange' },
    'return_purchase_order': { label: 'Hoàn trả nhập', color: 'orange' },
    'adjustment_increase': { label: 'Điều chỉnh tăng', color: 'cyan' },
    'adjustment_decrease': { label: 'Điều chỉnh giảm', color: 'magenta' },
    'damage': { label: 'Hư hỏng', color: 'red' },
    'count_check': { label: 'Kiểm kho', color: 'purple' },
  };

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'created_at',
      key: 'date',
      width: 180,
      render: (value) => value ? dayjs(value).format('DD/MM/YYYY HH:mm:ss') : '-',
      sorter: (a, b) => dayjs(a.created_at).valueOf() - dayjs(b.created_at).valueOf(),
    },
    {
      title: 'Loại Giao Dịch',
      dataIndex: 'transaction_type',
      key: 'transaction_type',
      width: 140,
      render: (type) => {
        const info = transactionTypeMap[type] || { label: type, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: 'Thay Đổi',
      dataIndex: 'quantity_change',
      key: 'quantity_change',
      width: 90,
      render: (change) => (
        <span style={{ color: change > 0 ? '#52c41a' : '#ff4d4f', fontWeight: 'bold' }}>
          {change > 0 ? '+' : ''}{change}
        </span>
      ),
    },
    {
      title: 'Tồn Trước',
      dataIndex: 'quantity_before',
      key: 'quantity_before',
      width: 90,
      render: (v) => <strong>{v}</strong>,
    },
    {
      title: 'Tồn Sau',
      dataIndex: 'quantity_after',
      key: 'quantity_after',
      width: 90,
      render: (v) => <strong style={{ color: '#1890ff' }}>{v}</strong>,
    },
    {
      title: 'Nhà cung cấp',
      dataIndex: 'supplier_name',
      key: 'supplier_name',
      ellipsis: true,
      render: (supplier) => supplier || '-',
    },
    {
      title: 'Lý Do / Ghi Chú',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (reason) => reason || '-',
    },
  ];

  const selectedProduct = products.find(p => p.id === currentProduct);
  const filterControlStyle = { width: '100%', height: 40 };
  const cardStyle = { borderRadius: 12, border: '1px solid #e6edf5' };
  const cardBodyStyle = { padding: 16 };

  return (
    <div style={{ padding: 24, background: '#f3f6fb', minHeight: '100vh' }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, color: '#1f2d3d', fontWeight: 700 }}>Lịch Sử Kho (Thẻ Kho)</h2>
        <div style={{ color: '#6b7a90', marginTop: 6 }}>
          Theo dõi toàn bộ biến động tồn kho theo thời gian thực
        </div>
      </div>

      {/* Bộ lọc */}
      <Card style={{ ...cardStyle, marginBottom: 16 }} bodyStyle={cardBodyStyle}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={8} lg={7}>
            <Select
              placeholder="Chọn sản phẩm"
              value={currentProduct}
              onChange={setCurrentProduct}
              allowClear
              style={filterControlStyle}
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {products.map(p => (
                <Select.Option key={p.id} value={p.id} label={`${p.product_code} - ${p.name}`}>
                  {p.product_code} - {p.name}
                </Select.Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6} lg={4}>
            <Select
              placeholder="Loại giao dịch"
              value={transactionType}
              onChange={setTransactionType}
              allowClear
              style={filterControlStyle}
              options={Object.entries(transactionTypeMap).map(([value, info]) => ({
                value,
                label: info.label
              }))}
            />
          </Col>

          <Col xs={24} sm={12} md={6} lg={4}>
            <DatePicker
              placeholder="Từ ngày"
              value={startDate}
              onChange={setStartDate}
              style={filterControlStyle}
              format="DD/MM/YYYY"
            />
          </Col>

          <Col xs={24} sm={12} md={6} lg={4}>
            <DatePicker
              placeholder="Đến ngày"
              value={endDate}
              onChange={setEndDate}
              style={filterControlStyle}
              format="DD/MM/YYYY"
            />
          </Col>

          <Col xs={24} sm={12} md={6} lg={5}>
            <Button
              type="primary"
              block
              icon={<SearchOutlined />}
              onClick={handleSearch}
              style={{ height: 40, borderRadius: 8, fontWeight: 600 }}
            >
              Tìm Kiếm
            </Button>
          </Col>
        </Row>

        {selectedProduct && (
          <div style={{ marginTop: 14, padding: 14, background: '#f7faff', border: '1px solid #dbe8ff', borderRadius: 10 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <strong>Sản phẩm:</strong> {selectedProduct.product_code} - {selectedProduct.name}
              </div>
              <div>
                <strong>Tồn kho hiện tại:</strong>{' '}
                <span style={{ fontSize: 16, fontWeight: 'bold', color: '#1890ff' }}>
                  {selectedProduct.quantity || 0} {selectedProduct.unit}
                </span>
              </div>
            </Space>
          </div>
        )}
      </Card>

      {/* Bảng lịch sử */}
      {history.length > 0 ? (
        <Card style={cardStyle} bodyStyle={{ padding: 0 }}>
          <Table
            columns={columns}
            dataSource={history}
            loading={loading}
            rowKey={(_, index) => index}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total) => `Tổng ${total} giao dịch`
            }}
            style={{ background: '#fff', borderRadius: 12 }}
            scroll={{ x: 1200 }}
            size="middle"
          />
        </Card>
      ) : (
        <Card style={cardStyle}>
          <Empty
            description={currentProduct ? 'Không có lịch sử giao dịch' : 'Chưa có dữ liệu lịch sử kho'}
          />
        </Card>
      )}
    </div>
  );
}
