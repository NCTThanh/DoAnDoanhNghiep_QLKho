import React, { useState, useEffect } from 'react';
import { Input, Button, Table, message, Card } from 'antd';
import { PlusOutlined, DeleteOutlined, PrinterOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import axios from 'axios';
import InvoicePrint from '../components/Order/InvoicePrint';

const API_URL = 'http://localhost:5000/api';

const CreateOrderPage = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customer, setCustomer] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [showPrint, setShowPrint] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);

  // Tìm sản phẩm realtime
  useEffect(() => {
    if (searchTerm.length > 1) {
      axios.get(`${API_URL}/products`, { params: { search: searchTerm } })
        .then(res => setProducts(res.data.data))
        .catch(() => message.error("Lỗi tìm sản phẩm"));
    } else {
      setProducts([]);
    }
  }, [searchTerm]);

  const addToCart = (product) => {
    const stock = Number(product.quantity || 0);
    if (stock <= 0) {
      message.warning(`Sản phẩm ${product.name} đã hết hàng`);
      return;
    }

    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity >= stock) {
        message.warning(`Không thể thêm quá tồn kho (${stock})`);
        return;
      }
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1, quantity_in_stock: Number(product.quantity || 0) }]);
    }
    message.success(`Đã thêm ${product.name}`);
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id, quantity) => {
    if (quantity < 1) return;
    setCart(cart.map(item => {
      if (item.id !== id) return item;
      const stock = Number(item.quantity_in_stock ?? item.quantity ?? 0);
      if (quantity > stock) {
        message.warning(`Không thể vượt tồn kho (${stock})`);
        return item;
      }
      return { ...item, quantity };
    }));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.selling_price * item.quantity, 0);
  const finalAmount = Math.max(0, totalAmount - discount);

  const createOrder = async () => {
    try {
      const res = await axios.post(`${API_URL}/orders`, {
        customer_id: customer?.id || null,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        })),
        discount
      });

      message.success('Tạo đơn hàng thành công!');
      
      setCurrentOrder({
        ...res.data,
        items: cart.map(item => ({ ...item, quantity_in_stock: item.quantity_in_stock ?? item.quantity })),
        final_amount: finalAmount,
        created_at: new Date().toISOString()
      });
      
      setShowPrint(true);
      setCart([]); // Reset giỏ
    } catch (err) {
      message.error(err?.response?.data?.message || 'Tạo đơn thất bại!');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 bg-gray-50 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Tìm sản phẩm */}
        <div className="lg:col-span-2">
          <Card title="Tìm sản phẩm" className="shadow-sm">
            <Input
              size="large"
              placeholder="Nhập tên hoặc mã vạch sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4"
            />

            <Table
              dataSource={products}
              rowKey="id"
              pagination={false}
              columns={[
                { title: 'Tên hàng', dataIndex: 'name' },
                { title: 'Giá bán', dataIndex: 'selling_price', render: v => v.toLocaleString() + ' ₫' },
                { title: 'Tồn kho', dataIndex: 'quantity', width: 90, render: v => <strong>{Number(v || 0)}</strong> },
                { title: 'Hành động', render: (_, record) => (
                  <Button type="primary" onClick={() => addToCart(record)} disabled={Number(record.quantity || 0) <= 0}>
                    Thêm
                  </Button>
                )}
              ]}
            />
          </Card>
        </div>

        {/* RIGHT: Giỏ hàng + Thanh toán */}
        <div>
          <Card title={`Giỏ hàng (${cart.length})`} className="shadow-sm h-full">
            <div className="max-h-[60vh] overflow-auto">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center py-3 border-b">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.selling_price.toLocaleString()} ₫</p>
                    <p className="text-xs text-gray-400">Tồn: {Number(item.quantity_in_stock ?? item.quantity ?? 0)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="small" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button size="small" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</Button>
                    <Button danger icon={<DeleteOutlined />} onClick={() => removeFromCart(item.id)} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex justify-between text-lg">
                <span>Tổng tiền:</span>
                <span>{totalAmount.toLocaleString()} ₫</span>
              </div>
              <Input 
                type="number" 
                placeholder="Giảm giá" 
                value={discount} 
                onChange={e => setDiscount(Number(e.target.value))} 
              />
              <div className="flex justify-between text-xl font-bold border-t pt-3">
                <span>Thanh toán:</span>
                <span>{finalAmount.toLocaleString()} ₫</span>
              </div>

              <Button 
                type="primary" 
                size="large" 
                block 
                onClick={createOrder}
                disabled={cart.length === 0}
              >
                Thanh toán & In hóa đơn
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal In hóa đơn */}
      {showPrint && currentOrder && (
        <InvoicePrint 
          order={currentOrder} 
          onClose={() => setShowPrint(false)} 
        />
      )}
    </motion.div>
  );
};

export default CreateOrderPage;