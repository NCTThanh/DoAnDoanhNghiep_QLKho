import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Upload } from 'antd';
import { UploadOutlined, PlusOutlined } from '@ant-design/icons';
import 'antd/dist/reset.css';

const { Option } = Select;

export default function ProductManagement() {
    const [products, setProducts] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    const fetchProducts = async () => {
        const response = await axios.get('http://localhost:5000/api/products');
        setProducts(response.data);
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleAdd = async (values) => {
        const formData = new FormData();
        Object.keys(values).forEach(key => {
            if (key === 'image' && values.image) {
                formData.append('image', values.image.file.originFileObj);
            } else {
                formData.append(key, values[key]);
            }
        });

        await axios.post('http://localhost:5000/api/products', formData);
        setIsModalVisible(false);
        form.resetFields();
        fetchProducts();
    };

    const columns = [
        { title: 'Mã hàng', dataIndex: 'product_code', key: 'product_code' },
        { title: 'Tên hàng', dataIndex: 'name', key: 'name' },
        { title: 'Giá bán', dataIndex: 'sell_price', key: 'sell_price', render: val => Number(val).toLocaleString('vi-VN') },
        { title: 'Ưu đãi (%)', dataIndex: 'discount_percent', key: 'discount_percent' },
        { title: 'Tồn kho', dataIndex: 'quantity', key: 'quantity' },
        { title: 'Vị trí', key: 'location', render: (_, record) => `${record.zone || ''} - ${record.shelf || ''}` },
    ];

    return (
        <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2>Hàng hóa</h2>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
                    Thêm mới
                </Button>
            </div>
            
            <Table 
                dataSource={products} 
                columns={columns} 
                rowKey="id" 
                pagination={{ pageSize: 10 }}
                style={{ background: '#fff', borderRadius: 8 }}
            />

            <Modal title="Thêm hàng hóa" open={isModalVisible} onCancel={() => setIsModalVisible(false)} onOk={() => form.submit()}>
                <Form form={form} layout="vertical" onFinish={handleAdd}>
                    <Form.Item name="product_code" label="Mã hàng hóa" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="name" label="Tên hàng" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="base_price" label="Giá vốn" rules={[{ required: true }]}>
                        <InputNumber style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="sell_price" label="Giá bán" rules={[{ required: true }]}>
                        <InputNumber style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="discount_percent" label="Ưu đãi (%)">
                        <InputNumber style={{ width: '100%' }} max={100} min={0} />
                    </Form.Item>
                    <Form.Item name="location_id" label="Vị trí lưu kho">
                        <Select>
                            <Option value="1">Khu A - Kệ 1</Option>
                            <Option value="2">Khu A - Kệ 2</Option>
                            <Option value="3">Khu B - Kệ 1</Option>
                            <Option value="4">Khu C - Kệ 1</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="image" label="Hình ảnh">
                        <Upload beforeUpload={() => false} maxCount={1}>
                            <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
                        </Upload>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}