/**
 * 地址解析API路由
 * 作者: 阿瑞
 * 功能: 解析文本中的姓名、电话和地址信息
 * 版本: 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';

interface ExtractedInfoItem {
    text: string;
    start: number;
    end: number;
    probability: number;
}

interface ExtractedInfo {
    姓名?: ExtractedInfoItem[];
    电话?: ExtractedInfoItem[];
}

interface ExtractInfoResponse {
    extracted_info: ExtractedInfo[];
}

interface ParseLocationResponse {
    province: string | null;
    city: string | null;
    county: string | null;
    detail: string | null;
    full_location: string | null;
    orig_location: string | null;
    town: string | null;
    village: string | null;
}

interface CombinedResponse {
    name: string | null;
    phone: string | null;
    address: ParseLocationResponse | null;
}

/**
 * POST处理函数
 * 接收文本内容，解析出姓名、电话和地址信息
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { text } = body;

        if (!text || typeof text !== 'string') {
            return NextResponse.json(
                { error: '请求参数错误，缺少文本内容' }, 
                { status: 400 }
            );
        }

        // 从环境变量获取 API 的 URL 
        const extractInfoUrl = process.env.EXTRACT_INFO_API_URL || 'http://192.168.1.22:8006/extract_info/';
        const parseLocationUrl = process.env.PARSE_LOCATION_API_URL || 'http://192.168.1.22:8100/parse_location/';

        // 第一步：提取姓名和电话
        const extractInfoResponse = await fetch(extractInfoUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });

        const extractedInfoData = await extractInfoResponse.json() as ExtractInfoResponse;
        const extractedInfo = extractedInfoData.extracted_info[0];

        let name: string | null = null;
        let phone: string | null = null;

        if (extractedInfo['姓名'] && extractedInfo['姓名'].length > 0) {
            name = extractedInfo['姓名'][0].text;
        }

        if (extractedInfo['电话'] && extractedInfo['电话'].length > 0) {
            phone = extractedInfo['电话'][0].text;
        }

        // 从原始文本中移除姓名和电话，得到地址部分
        let addressText = text;

        if (name) {
            addressText = addressText.replace(name, '').trim();
        }

        if (phone) {
            addressText = addressText.replace(phone, '').trim();
        }
        
        // 第二步：解析地址
        const parseLocationResponse = await fetch(parseLocationUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: addressText })
        });
        
        const locationData = await parseLocationResponse.json() as ParseLocationResponse;

        const combinedResponse: CombinedResponse = {
            name,
            phone,
            address: locationData,
        };

        return NextResponse.json(combinedResponse);
    } catch (error: any) {
        console.error('解析出错：', error);
        return NextResponse.json(
            { error: '服务器内部错误' },
            { status: 500 }
        );
    }
} 