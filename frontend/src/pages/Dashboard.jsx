import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import axios from 'axios';

export default function Dashboard() {
    const [data, setData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/inventory/dashboard');
                setData(response.data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchData();
    }, []);

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={8}>
                    <Card>
                        <Statistic title="Doanh thu hôm nay" value={8616000} suffix="₫" />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic title="Đơn hàng mới" value={15} />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic title="Trả hàng" value={0} />
                    </Card>
                </Col>
            </Row>

            <Card title="Doanh thu thuần">
                <div style={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer>
                        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <Line type="monotone" dataKey="daily_revenue" stroke="#1890ff" strokeWidth={3} />
                            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </motion.div>
    );
}