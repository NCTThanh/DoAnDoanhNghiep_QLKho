import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Tag, message } from 'antd';
import { PlusOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { fetchProducts } from '../services/api';

const Products = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetchProducts();
            setData(res.data);
        } catch (err) {
            message.error('Không thể tải dữ liệu');
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const columns = [
        {
            title: 'Hình ảnh',
            dataIndex: 'image_url',
            render: (url) => <img src={`http://localhost:5000${url}`} alt="prod" style={{ width: 40, borderRadius: 4 }} />
        },
        { title: 'Mã hàng', dataIndex: 'product_code' },
        { title: 'Tên hàng', dataIndex: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
        { 
            title: 'Giá bán', 
            dataIndex: 'sell_price', 
            render: (val) => <b style={{ color: '#1890ff' }}>{Number(val).toLocaleString()} ₫</b> 
        },
        { 
            title: 'Tồn kho', 
            dataIndex: 'quantity', 
            render: (q) => <Tag color={q > 10 ? 'green' : 'red'}>{q}</Tag> 
        },
        { title: 'Vị trí', render: (_, r) => `${r.zone} - ${r.shelf}` },
        {
            title: 'Thao tác',
            render: () => (
                <Space>
                    <Button icon={<EditOutlined />} size="small" />
                </Space>
            )
        }
    ];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
                <Input prefix={<SearchOutlined />} placeholder="Tìm kiếm theo mã hoặc tên hàng" style={{ width: 300 }} />
                <Button type="primary" icon={<PlusOutlined />}>Thêm hàng hóa</Button>
            </div>
            <Table 
                columns={columns} 
                dataSource={data} 
                rowKey="id" 
                loading={loading}
                pagination={{ pageSize: 8 }}
            />
        </motion.div>
    );
};

export default Products;