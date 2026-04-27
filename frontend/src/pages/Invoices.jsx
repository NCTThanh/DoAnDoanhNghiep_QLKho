import React, { useState, useEffect } from 'react';
import { Table, Button } from 'antd';
import axios from 'axios';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    axios.get('/api/invoices').then(res => setInvoices(res.data.data));
  }, []);

  const columns = [
    { title: 'Mã hóa đơn', dataIndex: 'invoice_code' },
    { title: 'Mã đơn', dataIndex: 'order_code' },
    { title: 'Tổng tiền', dataIndex: 'total_amount', render: v => v.toLocaleString() + ' ₫' },
    { title: 'Ngày', dataIndex: 'created_at' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Danh sách Hóa đơn</h1>
      <Table columns={columns} dataSource={invoices} rowKey="id" />
    </div>
  );
};

export default Invoices;