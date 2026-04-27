import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, DatePicker, Modal, message } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import OrderDetail from '../components/OrderDetail';

const { RangePicker } = DatePicker;

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/orders');
      setOrders(res.data.data);
    } catch (err) {
      message.error("Lỗi tải dữ liệu");
    }
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const columns = [
    { title: 'Mã đơn', dataIndex: 'order_code', key: 'order_code' },
    { title: 'Khách hàng', dataIndex: 'customer_name', key: 'customer' },
    { title: 'Người bán', dataIndex: 'seller', key: 'seller' },
    { title: 'Tổng tiền', dataIndex: 'final_amount', key: 'amount', render: v => v.toLocaleString() + ' ₫' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: s => (
      <span className={`px-3 py-1 rounded-full text-sm ${s === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
        {s === 'completed' ? 'Hoàn thành' : 'Đang xử lý'}
      </span>
    )},
    { title: 'Thời gian', dataIndex: 'created_at', key: 'time' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Đơn hàng</h1>
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setIsModalOpen(true)}>
          Tạo đơn hàng
        </Button>
      </div>

      {/* Filter giống KiotViet */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex gap-4 flex-wrap">
        <RangePicker placeholder={['Từ ngày', 'Đến ngày']} />
        <Select placeholder="Trạng thái" style={{ width: 150 }} options={[
          { label: 'Tất cả', value: '' },
          { label: 'Hoàn thành', value: 'completed' },
          { label: 'Đang xử lý', value: 'pending' },
        ]} />
        <Input prefix={<SearchOutlined />} placeholder="Tìm mã đơn hàng..." style={{ width: 250 }} />
      </div>

      <Table 
        columns={columns} 
        dataSource={orders} 
        loading={loading}
        rowKey="id"
        onRow={(record) => ({
          onClick: () => setSelectedOrder(record),
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