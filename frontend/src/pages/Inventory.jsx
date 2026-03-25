import React from 'react';
import { Table, Button, Tag } from 'antd';
import { motion } from 'framer-motion';

const Inventory = () => {
    const columns = [
        { title: 'Mã phiếu', dataIndex: 'id', key: 'id' },
        { title: 'Thời gian', dataIndex: 'time', key: 'time' },
        { title: 'Loại giao dịch', dataIndex: 'type', render: (text) => <Tag color="blue">{text}</Tag> },
        { title: 'Tổng giá trị', dataIndex: 'total', render: (val) => `${val.toLocaleString()} ₫` },
    ];

    const data = [
        { id: 'PN0001', time: '2026-03-25 10:00', type: 'Nhập hàng', total: 1500000 },
    ];

    return (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2>Giao dịch kho</h2>
                <Button type="primary">Tạo phiếu mới</Button>
            </div>
            <Table dataSource={data} columns={columns} rowKey="id" />
        </motion.div>
    );
};

export default Inventory;