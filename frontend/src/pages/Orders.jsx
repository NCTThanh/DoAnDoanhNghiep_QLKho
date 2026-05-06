import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, DatePicker, message } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import OrderDetail from '../components/OrderDetail';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const { RangePicker } = DatePicker;
const API_URL = 'http://localhost:5000/api';

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dateRange, setDateRange] = useState(null);

  const fetchOrders = async (customFilters) => {
    setLoading(true);
    try {
      const activeRange = customFilters?.dateRange ?? dateRange;
      const params = {
        search: customFilters?.search ?? search,
        status: customFilters?.status ?? status,
      };
      if (activeRange && activeRange.length === 2) {
        params.start_date = activeRange[0].format('YYYY-MM-DD');
        params.end_date = activeRange[1].format('YYYY-MM-DD');
      }
      const res = await axios.get(`${API_URL}/orders`, { params });
      setOrders(res.data.data);
    } catch (err) {
      message.error("Lỗi tải dữ liệu");
    }
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleViewOrderDetail = async (order) => {
    try {
      const res = await axios.get(`${API_URL}/orders/${order.id}`);
      setSelectedOrder(res.data.data);
    } catch (error) {
      message.error(error?.response?.data?.message || 'Không tải được chi tiết đơn hàng');
    }
  };

  const columns = [
    { title: 'Mã đơn', dataIndex: 'order_code', key: 'order_code' },
    { title: 'Khách hàng', dataIndex: 'customer_name', key: 'customer' },
    { title: 'Người bán', dataIndex: 'seller', key: 'seller' },
    { title: 'Tổng tiền', dataIndex: 'final_amount', key: 'amount', render: v => Number(v || 0).toLocaleString() + ' ₫' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: s => (
      <span className={`px-3 py-1 rounded-full text-sm ${s === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
        {s === 'completed' ? 'Hoàn thành' : 'Đang xử lý'}
      </span>
    )},
    { title: 'Thời gian', dataIndex: 'created_at', key: 'time', render: v => dayjs(v).format('DD/MM/YYYY HH:mm:ss') },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Đơn hàng</h1>
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => navigate('/create-order')}>
          Tạo đơn hàng
        </Button>
      </div>

      {/* Filter giống KiotViet */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex gap-4 flex-wrap">
        <RangePicker placeholder={['Từ ngày', 'Đến ngày']} value={dateRange} onChange={setDateRange} />
        <Select placeholder="Trạng thái" style={{ width: 150 }} options={[
          { label: 'Tất cả', value: '' },
          { label: 'Hoàn thành', value: 'completed' },
          { label: 'Đang xử lý', value: 'pending' },
        ]} value={status} onChange={setStatus} />
        <Input prefix={<SearchOutlined />} placeholder="Tìm mã đơn hàng..." style={{ width: 250 }} value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button type="primary" onClick={() => fetchOrders()}>Lọc</Button>
        <Button onClick={() => {
          setSearch('');
          setStatus('');
          setDateRange(null);
          fetchOrders({ search: '', status: '', dateRange: null });
        }}>Đặt lại</Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={orders} 
        loading={loading}
        rowKey="id"
        onRow={(record) => ({
          onClick: () => handleViewOrderDetail(record),
        })}
        className="cursor-pointer"
      />

      <AnimatePresence>
        {selectedOrder && (
          <OrderDetail 
            order={selectedOrder} 
            onClose={() => setSelectedOrder(null)} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}