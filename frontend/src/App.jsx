import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from 'antd';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Inventory from './pages/Inventory';

const { Content, Header } = Layout;

function App() {
    return (
        <Router>
            <Layout style={{ minHeight: '100vh' }}>
                <Sidebar />
                <Layout>
                    <Header style={{ background: '#001529', color: '#fff', padding: '0 20px', fontSize: '18px' }}>
                        Hệ Thống Quản Lý Bách Hóa - STU
                    </Header>
                    <Content style={{ margin: '20px', background: '#fff', padding: '20px', borderRadius: '8px' }}>
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/products" element={<Products />} />
                            <Route path="/inventory" element={<Inventory />} />
                        </Routes>
                    </Content>
                </Layout>
            </Layout>
        </Router>
    );
}

export default App;