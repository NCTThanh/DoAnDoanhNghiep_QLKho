import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Tag, message } from 'antd';
import { PlusOutlined, EditOutlined, SearchOutlined, DeleteOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import axios from 'axios';

export default function Products() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            // Dùng axios gọi thẳng để tránh lỗi file api.js
            const res = await axios.get('http://localhost:5000/api/products');
            
            // Xử lý an toàn: Đảm bảo dữ liệu đưa vào Table luôn là một mảng (Array)
            if (Array.isArray(res.data)) {
                setData(res.data);
            } else if (res.data && Array.isArray(res.data.data)) {
                setData(res.data.data);
            } else {
                setData([]);
            }
        } catch (err) {
            message.error('Không thể tải dữ liệu hàng hóa');
        }
        setLoading(false);
    };

    // Dấu [] ở đây cực kỳ quan trọng để ngăn chặn vòng lặp vô tận (ping cao)
    useEffect(() => {
        loadData();
    }, []);

    const columns = [
        {
            title: 'Hình ảnh',
            dataIndex: 'image_url',
            render: (url) => url 
                ? <img src={`http://localhost:5000${url}`} alt="prod" className="w-10 h-10 object-cover rounded" />
                : <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-[10px] text-gray-500">No Img</div>
        },
        { title: 'Mã hàng', dataIndex: 'product_code' },
        { title: 'Tên hàng', dataIndex: 'name' },
        { 
            title: 'Giá bán', 
            dataIndex: 'sell_price', 
            render: (val) => <b className="text-[#1890ff]">{Number(val || 0).toLocaleString()} ₫</b> 
        },
        { 
            title: 'Tồn kho', 
            dataIndex: 'quantity', 
            render: (q) => <Tag color={(q || 0) > 10 ? 'green' : 'red'}>{q || 0}</Tag> 
        },
        { 
            title: 'Vị trí', 
            render: (_, r) => `${r.zone || '---'} - ${r.shelf || '---'}` 
        },
        {
            title: 'Thao tác',
            render: () => (
                <Space>
                    <Button icon={<EditOutlined />} size="small" />
                    <Button icon={<DeleteOutlined />} size="small" danger />
                </Space>
            )
        }
    ];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Quản lý hàng hóa</h1>
                <Space>
                    <Input prefix={<SearchOutlined />} placeholder="Tìm kiếm theo mã hoặc tên..." className="w-72" />
                    <Button type="primary" icon={<PlusOutlined />}>Thêm hàng hóa</Button>
                </Space>
            </div>
            
            <Table 
                columns={columns} 
                dataSource={data} 
                rowKey="id" 
                loading={loading}
                pagination={{ pageSize: 8 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100"
            />
        </motion.div>
    );
}