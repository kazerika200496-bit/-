import { Receipt } from '@prisma/client';

export interface CsvFormatDefinition {
    headers: string[];
    rowMapper: (receipt: Receipt) => (string | number)[];
}

// エスケープ処理ヘルパー
const escapeCsv = (str: string | null | undefined) => {
    if (!str) return '""';
    return `"${str.toString().replace(/"/g, '""')}"`;
};

// ① 現状の汎用フォーマット（維持）
export const GENERIC_FORMAT: CsvFormatDefinition = {
    headers: [
        '日付',
        '伝票No.',
        '勘定科目コード',
        '勘定科目',
        '補助科目',
        '支払い先',
        '摘要',
        '税区分',
        '金額',
        '消費税額',
        '元画像'
    ],
    rowMapper: (r: any) => {
        const dateStr = r.receiptDate ? new Date(r.receiptDate).toISOString().split('T')[0] : '';
        const imageInfo = r.imageUrl && r.imageUrl.startsWith('data:image') ? 'Base64画像保存済' : (r.imageUrl || '');

        return [
            dateStr,
            escapeCsv(r.slipNo),
            escapeCsv(r.accountCode),
            escapeCsv(r.accountName),
            escapeCsv(r.subAccount),
            escapeCsv(r.payee),
            escapeCsv(r.description),
            escapeCsv(r.taxCategory),
            r.amount || 0,
            r.taxAmount || 0,
            escapeCsv(imageInfo)
        ];
    }
};

// ② 将来の弥生会計用フォーマット（仮枠組み・今後詳細が決まり次第ここを埋める）
export const YAYOI_DRAFT_FORMAT: CsvFormatDefinition = {
    headers: [
        '識別フラグ',
        '伝票No',
        '決算',
        '取引日付',
        '借方勘定科目',
        '借方補助科目',
        '借方部門',
        '借方税区分',
        '借方金額',
        '借方税額',
        '貸方勘定科目',
        '貸方補助科目',
        '貸方部門',
        '貸方税区分',
        '貸方金額',
        '貸方税額',
        '摘要',
        '番号',
        '期日',
        'タイプ',
        '生成元'
    ],
    rowMapper: (r: any) => {
        const dateStr = r.receiptDate ? new Date(r.receiptDate).toISOString().split('T')[0].replace(/-/g, '/') : ''; // 弥生は通常YYYY/MM/DD
        
        return [
            '2111', // 仕訳データ識別フラグ（例）
            escapeCsv(r.slipNo),
            '""', // 決算
            dateStr,
            escapeCsv(r.accountName), // 借方勘定科目
            escapeCsv(r.subAccount),  // 借方補助科目
            '""', // 借方部門
            escapeCsv(r.taxCategory), // 借方税区分
            r.amount || 0, // 借方金額
            r.taxAmount || 0, // 借方税額
            '"現金"', // 貸方勘定科目（運用ルール確認後に変更）
            '""', // 貸方補助科目
            '""', // 貸方部門
            '"対象外"', // 貸方税区分
            r.amount || 0, // 貸方金額
            r.taxAmount || 0, // 貸方税額
            escapeCsv(r.payee ? `${r.payee} ${r.description || ''}` : r.description), // 摘要
            '""', // 番号
            '""', // 期日
            '"3"', // タイプ
            '"領収書管理アプリ"' // 生成元
        ];
    }
};

export const FORMATS: Record<string, CsvFormatDefinition> = {
    generic: GENERIC_FORMAT,
    yayoi: YAYOI_DRAFT_FORMAT
};
