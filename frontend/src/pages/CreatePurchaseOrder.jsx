import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Input, Button, Select, Table, InputNumber, Space, message, Card, Row, Col, DatePicker, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined, CheckOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'antd/dist/reset.css';

const API_URL = 'http://localhost:5000/api';

export default function CreatePurchaseOrder() {
  const [form] = Form.useForm();
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchSuppliers();
    fetchProducts();
    // check query param id for edit
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      loadPOForEdit(id);
    }
  }, []);

  const loadPOForEdit = async (id) => {
    try {
      const resp = await axios.get(`${API_URL}/purchase-orders/${id}`);
      const po = resp.data.data;
      setIsEdit(true);
      setEditingId(id);
      form.setFieldsValue({
        supplier_id: po.supplier_id,
        po_date: dayjs(po.po_date),
        expected_delivery_date: po.expected_delivery_date ? dayjs(po.expected_delivery_date) : null,
        note: po.note,
        payment_amount: Number(po.paid_amount) || 0,
      });
      const loadedItems = (po.details || []).map(d => ({
        product_id: d.product_id,
        quantity: d.quantity,
        unit_price: Number(d.unit_price),
        total_price: Number(d.total_price),
      }));
      setItems(loadedItems);
      const total = loadedItems.reduce((s, it) => s + (it.total_price || 0), 0);
      setTotalAmount(total);
      setPaymentAmount(Number(po.paid_amount) || 0);
    } catch (err) {
      message.error('Lỗi tải PO để sửa: ' + (err.response?.data?.message || err.message));
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(`${API_URL}/suppliers?status=active`);
      setSuppliers(response.data.data || []);
    } catch (error) {
      message.error('Lỗi tải NCC');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products`);
      setProducts(response.data.data || []);
    } catch (error) {
      message.error('Lỗi tải sản phẩm');
    }
  };

  // Thêm mặt hàng
  const handleAddItem = () => {
    setItems([...items, { product_id: null, quantity: 1, unit_price: 0, total_price: 0 }]);
  };

  // Xóa mặt hàng
  const handleRemoveItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    calculateTotal(newItems);
  };

  // Cập nhật mặt hàng
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    // Tính total_price
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total_price = (newItems[index].quantity || 0) * (newItems[index].unit_price || 0);
    }

    setItems(newItems);
    calculateTotal(newItems);
  };

  // Tính tổng tiền
  const calculateTotal = (itemsList) => {
    const total = itemsList.reduce((sum, item) => sum + (item.total_price || 0), 0);
    setTotalAmount(total);
  };

  // Lưu phiếu
  const handleSubmit = async (values) => {
    if (items.length === 0) {
      message.error('Vui lòng thêm ít nhất một mặt hàng');
      return;
    }

    // Validate each item has a selected product
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.product_id) {
        message.error(`Mặt hàng thứ ${i + 1} chưa chọn sản phẩm`);
        return;
      }
      if (!it.quantity || it.quantity <= 0) {
        message.error(`Mặt hàng thứ ${i + 1} có số lượng không hợp lệ`);
        return;
      }
    }

    try {
      const payload = {
        supplier_id: values.supplier_id,
        po_date: values.po_date.format('YYYY-MM-DD'),
        expected_delivery_date: values.expected_delivery_date?.format('YYYY-MM-DD'),
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
        note: values.note,
        payment_amount: Number(values.payment_amount) || 0,
      };

      if (isEdit && editingId) {
        await axios.put(`${API_URL}/purchase-orders/${editingId}`, payload);
        message.success('Cập nhật PO thành công');
      } else {
        const response = await axios.post(`${API_URL}/purchase-orders`, payload);
        message.success('Tạo PO thành công: ' + response.data.data.po_code);
      }
      setTimeout(() => {
        window.location.href = '/purchase-orders';
      }, 1000);
    } catch (error) {
      message.error('Lỗi: ' + error.message);
    }
  };

  // Cột bảng
  const itemColumns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'product_id',
      render: (_, record, index) => (
        <Select
          placeholder="Chọn sản phẩm"
          value={record.product_id}
          onChange={(value) => {
            const product = products.find(p => p.id === value);
            handleItemChange(index, 'product_id', value);
            if (product) handleItemChange(index, 'unit_price', product.cost_price || 0);
          }}
          style={{ width: '100%' }}
        >
          {products.map(p => (
            <Select.Option key={p.id} value={p.id}>
              {p.product_code} - {p.name}
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'SL',
      dataIndex: 'quantity',
      width: 80,
      render: (_, record, index) => (
        <InputNumber
          value={record.quantity}
          onChange={(value) => handleItemChange(index, 'quantity', value)}
          min={1}
          precision={0}
        />
      ),
    },
    {
      title: 'Giá nhập',
      dataIndex: 'unit_price',
      width: 120,
      render: (_, record, index) => (
        <InputNumber
          value={record.unit_price}
          onChange={(value) => handleItemChange(index, 'unit_price', value)}
          min={0}
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
        />
      ),
    },
    {
      title: 'Tổng',
      dataIndex: 'total_price',
      width: 120,
      render: (value) => parseFloat(value).toLocaleString('vi-VN'),
    },
    {
      title: 'Thao tác',
      width: 80,
      render: (_, record, index) => (
        <Button danger size="small" icon={<DeleteOutlined />} onClick={() => handleRemoveItem(index)}>
          Xóa
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      <Card title={isEdit ? 'Sửa Phiếu Nhập Hàng' : 'Tạo Phiếu Nhập Hàng Mới'} style={{ maxWidth: '100%' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            po_date: dayjs(),
          }}
        >
          <h3>{isEdit ? 'Sửa Phiếu Nhập Hàng' : 'Tạo Phiếu Nhập Hàng Mới'}</h3>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Nhà Cung Cấp"
                name="supplier_id"
                rules={[{ required: true, message: 'Chọn NCC' }]}
              >
                <Select placeholder="Chọn nhà cung cấp">
                  {suppliers.map(s => (
                    <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Ngày lập PO"
                name="po_date"
                rules={[{ required: true }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Ngày dự kiến giao" name="expected_delivery_date">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Ghi chú" name="note">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Danh Sách Hàng Hóa</Divider>

          <Table
            columns={itemColumns}
            dataSource={items}
            pagination={false}
            rowKey={(record, index) => index}
            size="small"
            style={{ marginBottom: 16 }}
          />

          <Button
            type="dashed"
            block
            icon={<PlusOutlined />}
            onClick={handleAddItem}
            style={{ marginBottom: 16 }}
          >
            Thêm Hàng Hóa
          </Button>

          {/* Tóm tắt */}
          <Card
            type="inner"
            title="Tóm Tắt"
            extra={
              <span style={{ fontSize: 18, fontWeight: 'bold', color: '#1890ff' }}>
                Tổng: {parseFloat(totalAmount).toLocaleString('vi-VN')} ₫
              </span>
            }
          />

          <Row gutter={16} style={{ marginTop: 12 }}>
            <Col xs={24} sm={12}>
              <Form.Item label="Thanh toán cho NCC" name="payment_amount">
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  formatter={(value) => `${value}`.replace(/\(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => String(value).replace(/\D/g, '')}
                  value={paymentAmount}
                  onChange={(val) => setPaymentAmount(val)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Còn nợ">
                <Input
                  value={(totalAmount - (paymentAmount || 0)).toLocaleString('vi-VN') + ' ₫'}
                  disabled
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16} style={{ marginTop: 24 }}>
            <Col xs={24} sm={12}>
              <Button
                block
                onClick={() => window.location.href = '/purchase-orders'}
              >
                Hủy
              </Button>
            </Col>
            <Col xs={24} sm={12}>
              <Button
                type="primary"
                block
                icon={<SaveOutlined />}
                htmlType="submit"
              >
                {isEdit ? 'Cập nhật' : 'Lưu Nháp'}
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
}
