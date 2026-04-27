import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tag, Badge, Tooltip } from 'antd';
import axios from 'axios';
import { WarningOutlined } from '@ant-design/icons';

export default function WarehouseMap() {
    const [locations, setLocations] = useState([]);

    useEffect(() => {
        // Tạm thời gọi trực tiếp API products, sau này sẽ viết API map riêng
        const fetchMap = async () => {
            const res = await axios.get('http://localhost:5000/api/products');
            const products = res.data.data || res.data;
            
            // Nhóm sản phẩm theo vị trí (Zone & Shelf)
            const grouped = products.reduce((acc, curr) => {
                const locKey = `${curr.zone || 'Chưa phân'} - ${curr.shelf || 'Chưa phân'}`;
                if (!acc[locKey]) acc[locKey] = [];
                acc[locKey].push(curr);
                return acc;
            }, {});
            setLocations(Object.entries(grouped));
        };
        fetchMap();
    }, []);

    // Hàm kiểm tra sắp hết hạn (Demo: coi ngày hiện tại là cuối tháng 4/2026)
    const checkExpiring = (expDate) => {
        if (!expDate) return false;
        const daysLeft = (new Date(expDate) - new Date('2026-04-20')) / (1000 * 60 * 60 * 24);
        return daysLeft > 0 && daysLeft <= 30;
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 min-h-screen bg-gray-100">
            <h1 className="text-3xl font-extrabold text-[#005AAB] mb-8 uppercase tracking-wider">
                Sơ đồ Kho vật lý
            </h1>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                {locations.map(([locationName, items], idx) => (
                    <div key={idx} className="flex flex-col">
                        {/* Biển tên Khu vực */}
                        <div className="bg-gray-800 text-white font-bold text-center py-2 rounded-t-lg mx-4 z-10">
                            {locationName}
                        </div>
                        
                        {/* Khung Kệ Sắt (Rack) - Thiết kế mô phỏng ảnh thực tế */}
                        <div className="relative border-l-[12px] border-r-[12px] border-[#0070c0] bg-gray-50 min-h-[250px] shadow-xl flex flex-col justify-end pb-2">
                            
                            {/* Lưới thép phía sau (Trang trí) */}
                            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>

                            {/* Thanh dầm màu cam (Beam) */}
                            <div className="border-b-[16px] border-[#ed7d31] relative z-10 w-full flex flex-wrap items-end gap-3 px-4 pb-[2px] pt-10">
                                {items.map((item, i) => {
                                    const isExpiring = checkExpiring(item.exp_date);
                                    return (
                                        <Tooltip key={i} title={`HSD: ${item.exp_date ? new Date(item.exp_date).toLocaleDateString('vi-VN') : 'Không có'}`}>
                                            {/* Thùng carton sản phẩm */}
                                            <div className={`relative w-28 h-20 bg-[#dcb68a] border-2 ${isExpiring ? 'border-red-600 animate-pulse' : 'border-[#b58d5f]'} shadow-md flex flex-col justify-center items-center p-1 cursor-pointer transition-transform hover:-translate-y-2`}>
                                                
                                                {isExpiring && (
                                                    <Badge count={<WarningOutlined className="text-red-600 bg-white rounded-full text-lg" />} className="absolute -top-3 -right-2 z-20" />
                                                )}
                                                
                                                <span className="text-[10px] font-bold text-center leading-tight line-clamp-2 text-gray-900">
                                                    {item.name}
                                                </span>
                                                <span className="text-xs font-black mt-1 text-gray-800">
                                                    SL: {item.quantity}
                                                </span>
                                            </div>
                                        </Tooltip>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}