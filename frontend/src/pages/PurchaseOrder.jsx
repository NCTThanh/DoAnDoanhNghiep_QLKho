import React, { useState } from 'react';
import { Table, Button, Modal, Form, InputNumber, Select, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import axios from 'axios';

const { Option } = Select;

export default function PurchaseOrder() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [poList, setPoList] = useState([]);

    const handleCreatePO = async (values) => {
        const payload = {
            supplier_id: values.supplier_id,
            total_value: values.quantity * values.import_price,
            products: [{
                product_id: values.product_id,
                quantity: values.quantity,
                import_price: values.import_price,
                location_id: values.location_id
            }]
        };

        try {
            await axios.post('http://localhost:5000/api/inventory/purchase-orders', payload);
            message.success('Nhập hàng thành công');
            setIsModalOpen(false);
            form.resetFields();
        } catch (error) {
            message.error('Lỗi khi nhập hàng');
        }
    };

    const columns = [
        { title: 'Mã phiếu', dataIndex: 'id', key: 'id' },
        { title: 'Nhà cung cấp', dataIndex: 'supplier', key: 'supplier' },
        { title: 'Tổng tiền', dataIndex: 'total', key: 'total' },
        { title: 'Trạng thái', dataIndex: 'status', key: 'status' }
    ];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2>Nhập hàng</h2>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
                    Tạo phiếu nhập
                </Button>
            </div>

            <Table dataSource={poList} columns={columns} rowKey="id" style={{ background: '#fff' }} />

            <Modal title="Thêm sản phẩm nhập kho" open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => form.submit()}>
                <Form form={form} layout="vertical" onFinish={handleCreatePO}>
                    <Form.Item name="supplier_id" label="Nhà cung cấp" rules={[{ required: true }]}>
                        <Select>
                            <Option value={1}>NPP Tấn Tài Phát</Option>
                            <Option value={2}>CTY CP SP Sinh Thái</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="product_id" label="Sản phẩm" rules={[{ required: true }]}>
                        <Select>
                            <Option value={1}>Bia Tiger lon cao 330ml</Option>
                            <Option value={2}>Nước ngọt Coca Cola 320ml</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="location_id" label="Vị trí kho" rules={[{ required: true }]}>
                        <Select>
                            <Option value={1}>Khu A - Kệ 1</Option>
                            <Option value={2}>Khu B - Kệ 1</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="quantity" label="Số lượng" rules={[{ required: true }]}>
                        <InputNumber style={{ width: '100%' }} min={1} />
                    </Form.Item>
                    <Form.Item name="import_price" label="Giá nhập" rules={[{ required: true }]}>
                        <InputNumber style={{ width: '100%' }} min={0} />
                    </Form.Item>
                </Form>
            </Modal>
        </motion.div>
    );
}