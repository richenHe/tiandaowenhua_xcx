#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
解析大使Excel文件，生成legacy_students表的INSERT SQL
Excel列顺序：大使 | 真实名字 | 序号 | 初探班学员 | 初探时间 | 密训学员 | 密训时间 | 属性
"""

import openpyxl
import json
import re
import unicodedata
from datetime import datetime, date

EXCEL_PATH = r'd:\xwechat_files\wxid_39e9y59ni7cl12_e33b\msg\file\2026-04\大使(4).xlsx'

# 属性 → ambassador_level 映射（实际Excel中的值）
LEVEL_MAP = {
    '准青鸾大使': 1,
    '青鸾大使': 2,
    '鸿鹄大使': 3,
    # 兼容旧版名称（以防万一）
    '准全球大使': 1,
    '全球大使': 2,
    '超级全球大使': 3,
}

# 跨大使重复记录：学员名 → 正确的大使别名
# 由用户指定，对应 大使(1).xlsx 的实际数据
# 自引用案例（明爱/崔素英）由脚本自动处理，不在此列表
CORRECT_AMBASSADOR = {
    '孟俊': '明爱',
    '黄小林': '明行',
    '王平': '王微垭',
    '贺淼': '明萍',
    '王慧': '明東',
    '陈慧': '明爱',
    '麦倍高': '明静',
    '王娟': '任莉莉',
    '黄斌': '明利',
    '余斌': '黄慧岚',
}


def excel_text(val):
    """
    从单元格读出与 Excel 展示一致的 Unicode 文本，避免 str(float) 等隐式转换。
    使用 NFC 规范化，减少因组合字符顺序导致的「同字不同码」。
    """
    if val is None:
        return ''
    if isinstance(val, str):
        s = val.strip()
    elif isinstance(val, (int,)):
        s = str(val)
    elif isinstance(val, float):
        if val == int(val):
            s = str(int(val))
        else:
            s = str(val).strip()
    else:
        s = str(val).strip()
    if s in ('', 'None'):
        return ''
    return unicodedata.normalize('NFC', s)


def clean_name(name):
    """去掉首尾空格，去掉内部空格"""
    if not name:
        return ''
    return str(name).strip().replace(' ', '').replace('\u3000', '')


def extract_aliases(name):
    """从括号中提取别名，返回 (主名, [别名列表])"""
    aliases = []
    name_str = str(name)
    matches = re.findall(r'[（(]([^）)]+)[）)]', name_str)
    if matches:
        for m in matches:
            cleaned = clean_name(m)
            if cleaned:
                aliases.append(cleaned)
    main_name = re.sub(r'[（(][^）)]*[）)]', '', name_str).strip()
    main_name = clean_name(main_name)
    return main_name, aliases


def parse_date(val):
    """解析日期值，返回 date 对象或 None"""
    if not val:
        return None
    if isinstance(val, datetime):
        return val.date()
    if isinstance(val, date):
        return val
    s = str(val).strip()
    if not s or s in ('None', ''):
        return None
    for fmt in ('%Y/%m/%d', '%Y-%m-%d', '%Y/%m/%d %H:%M:%S', '%Y-%m-%d %H:%M:%S'):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            pass
    return None  # 无法解析 → 视为无效


def escape_sql(val):
    """基础SQL字符串转义"""
    if val is None:
        return 'NULL'
    s = str(val).replace("\\", "\\\\").replace("'", "\\'")
    return f"'{s}'"


def _merge_ambassador(ambassadors, amb_alias, amb_real, attr_str):
    """同一大使多行时合并：实名优先非空且非 None；等级取较大值（避免首行属性空导致 level=0）。"""
    if not amb_alias:
        return
    real = amb_real.strip() if amb_real else ''
    lv = LEVEL_MAP.get(attr_str, 0)
    if amb_alias not in ambassadors:
        ambassadors[amb_alias] = {
            'real_name': real if real else amb_alias,
            'level': lv,
        }
        return
    o = ambassadors[amb_alias]
    if lv > o['level']:
        o['level'] = lv
    if real:
        o['real_name'] = real


def main():
    # data_only=True 读取缓存值（与 xlsx 展示的公式结果/常量一致），姓名列均为常量，Unicode 保持原样
    wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)
    ws = wb.active

    rows = list(ws.iter_rows(values_only=True))
    data_rows = rows[1:]  # 跳过标题行

    # ==================== 第一步：构建大使注册表 ====================
    ambassadors = {}  # alias → {real_name, level}
    current_amb = None

    for row in data_rows:
        row = list(row) + [None] * max(0, 8 - len(row))
        amb_alias = excel_text(row[0])
        amb_real = excel_text(row[1])
        attr = excel_text(row[7]) if len(row) > 7 else ''

        if amb_alias:
            _merge_ambassador(ambassadors, amb_alias, amb_real, attr)

    print(f"[INFO] 发现大使 {len(ambassadors)} 位")
    levels = {}
    for info in ambassadors.values():
        l = info['level']
        levels[l] = levels.get(l, 0) + 1
    print(f"[INFO] 等级分布: {levels}")

    # ==================== 第二步：解析所有学员记录 ====================
    # key: (cleaned_student_name, amb_alias) → {student_name, aliases, chutan_date, mixin_date}
    student_records = {}
    current_amb = None

    for row in data_rows:
        row = list(row) + [None] * max(0, 8 - len(row))
        amb_alias = excel_text(row[0])
        if amb_alias:
            current_amb = amb_alias

        chutan_raw = row[3]
        chutan_date_raw = row[4]
        mixin_raw = row[5]
        mixin_date_raw = row[6]

        chutan_str = excel_text(chutan_raw)
        mixin_str = excel_text(mixin_raw)

        chutan_date = parse_date(chutan_date_raw)
        mixin_date = parse_date(mixin_date_raw)

        # 处理初探学员
        if chutan_str and current_amb:
            main_name, aliases = extract_aliases(chutan_str)
            if not main_name:
                main_name = clean_name(chutan_str)
            key = (main_name, current_amb)
            if key not in student_records:
                student_records[key] = {
                    'student_name': main_name,
                    'student_aliases': aliases[:],
                    'chutan_date': chutan_date,
                    'mixin_date': None,
                }
            else:
                rec = student_records[key]
                # 合并：取最晚日期
                if chutan_date and (rec['chutan_date'] is None or chutan_date > rec['chutan_date']):
                    rec['chutan_date'] = chutan_date
                for a in aliases:
                    if a not in rec['student_aliases']:
                        rec['student_aliases'].append(a)

        # 处理密训学员
        if mixin_str and current_amb:
            main_name, aliases = extract_aliases(mixin_str)
            if not main_name:
                main_name = clean_name(mixin_str)

            # 先尝试通过名字找已有记录
            key = (main_name, current_amb)
            found_key = None
            if key in student_records:
                found_key = key
            else:
                # 通过别名反向查找
                for k, rec in student_records.items():
                    if k[1] == current_amb:
                        all_names = [k[0]] + rec['student_aliases']
                        if main_name in all_names or any(a in all_names for a in aliases):
                            found_key = k
                            break

            if found_key:
                rec = student_records[found_key]
                if mixin_date and (rec['mixin_date'] is None or mixin_date > rec['mixin_date']):
                    rec['mixin_date'] = mixin_date
                for a in aliases:
                    if a not in rec['student_aliases']:
                        rec['student_aliases'].append(a)
            else:
                student_records[key] = {
                    'student_name': main_name,
                    'student_aliases': aliases[:],
                    'chutan_date': None,
                    'mixin_date': mixin_date,
                }

    print(f"[INFO] 原始学员记录（同大使去重后）: {len(student_records)} 条")

    # ==================== 第三步：处理自引用 ====================
    # 大使在自己的学员列表中 → 保留课程数据，移除自引用记录，
    # 后续该大使会以"大使-学员"身份出现（is_ambassador=1）
    self_ref_keys = set()
    self_ref_data = {}  # amb_alias → (chutan_date, mixin_date)
    for (name, amb), rec in list(student_records.items()):
        if clean_name(name) == clean_name(amb):
            self_ref_keys.add((name, amb))
            # 保存课程数据以备后用
            self_ref_data[amb] = {
                'chutan_date': rec['chutan_date'],
                'mixin_date': rec['mixin_date'],
                'student_aliases': rec['student_aliases'],
            }
            print(f"[INFO] 自引用: {name} 在 {amb} 下，移除自引用行")

    for k in self_ref_keys:
        del student_records[k]

    print(f"[INFO] 移除自引用后学员记录: {len(student_records)} 条")

    # ==================== 第四步：标记跨大使重复 ====================
    # 按学员名聚合，找出跨大使重复
    name_to_keys = {}
    for (name, amb) in student_records:
        if name not in name_to_keys:
            name_to_keys[name] = []
        name_to_keys[name].append((name, amb))

    dup_names = {n: keys for n, keys in name_to_keys.items() if len(keys) > 1}
    print(f"\n[INFO] 跨大使重复学员: {len(dup_names)} 人")

    excluded_keys = set()
    for name, keys in dup_names.items():
        ambs = [k[1] for k in keys]
        correct_amb = CORRECT_AMBASSADOR.get(name)
        if correct_amb:
            for k in keys:
                if k[1] != correct_amb:
                    excluded_keys.add(k)
                    print(f"[INFO] 排除: {name} 在 {k[1]} 下（正确大使: {correct_amb}）")
        else:
            # 没有指定正确大使，全部标记为重复（需人工处理）
            for k in keys:
                excluded_keys.add(k)
            print(f"[WARN] 未指定正确大使: {name} 在 {ambs} 下，全部标记为重复")

    # ==================== 第五步：构建最终记录列表 ====================
    final_records = []

    # A. 学员记录（含同时也是大使的学员）
    for key, rec in student_records.items():
        name, amb = key
        amb_info = ambassadors.get(amb, {})
        is_dup = 2 if key in excluded_keys else 0
        rec_real = amb_info.get('real_name') or ''
        if not rec_real.strip():
            rec_real = amb

        # 判断该学员是否也是大使
        is_amb = 0
        amb_level = 0
        amb_alias_val = None
        amb_real_val = None
        clean_n = clean_name(name)

        if clean_n in ambassadors:
            is_amb = 1
            amb_info_self = ambassadors[clean_n]
            amb_level = amb_info_self['level']
            amb_alias_val = clean_n
            amb_real_val = amb_info_self['real_name'] or clean_n

        final_records.append({
            'student_name': name,
            'student_aliases': rec['student_aliases'],
            'chutan_date': rec['chutan_date'],
            'mixin_date': rec['mixin_date'],
            'recommender_alias': amb,
            'recommender_real_name': rec_real,
            'is_ambassador': is_amb,
            'ambassador_alias': amb_alias_val,
            'ambassador_real_name': amb_real_val,
            'ambassador_level': amb_level,
            'is_duplicate': is_dup,
        })

    # B. 纯大使记录（自引用大使 + 没有出现在任何学员列表中的大使）
    all_student_names_clean = set(clean_name(k[0]) for k in student_records)

    for amb_alias, amb_info in ambassadors.items():
        clean_a = clean_name(amb_alias)
        if clean_a not in all_student_names_clean:
            # 此大使没有作为学员出现（或只出现在自引用中）
            self_data = self_ref_data.get(amb_alias, {})
            real_name = amb_info['real_name'] or amb_alias
            aliases = []
            if real_name and real_name != amb_alias:
                aliases = [real_name]
            # 合并自引用课程数据
            student_aliases_extra = self_data.get('student_aliases', [])
            for a in student_aliases_extra:
                if a not in aliases:
                    aliases.append(a)

            final_records.append({
                'student_name': amb_alias,
                'student_aliases': aliases,
                'chutan_date': self_data.get('chutan_date'),
                'mixin_date': self_data.get('mixin_date'),
                'recommender_alias': None,
                'recommender_real_name': None,
                'is_ambassador': 1,
                'ambassador_alias': amb_alias,
                'ambassador_real_name': real_name,
                'ambassador_level': amb_info['level'],
                'is_duplicate': 0,
            })
            if amb_alias in self_ref_data:
                print(f"[INFO] 自引用大使（有课程）: {amb_alias} (level={amb_info['level']})")
            else:
                print(f"[INFO] 纯大使（无课程）: {amb_alias} (level={amb_info['level']})")

    total = len(final_records)
    excluded = sum(1 for r in final_records if r['is_duplicate'] == 2)
    amb_count = sum(1 for r in final_records if r['is_ambassador'] == 1)
    print(f"\n[INFO] 最终记录数: {total}")
    print(f"[INFO] 其中排除记录(is_duplicate=2): {excluded}")
    print(f"[INFO] 其中大使记录(is_ambassador=1): {amb_count}")

    # ==================== 第六步：生成SQL ====================
    col_names = (
        "(student_name, student_aliases, chutan_date, mixin_date, "
        "recommender_alias, recommender_real_name, is_ambassador, "
        "ambassador_alias, ambassador_real_name, ambassador_level, is_duplicate)"
    )

    insert_rows = []
    for rec in final_records:
        aliases_val = 'NULL'
        if rec['student_aliases']:
            aliases_json = json.dumps(rec['student_aliases'], ensure_ascii=False)
            aliases_val = escape_sql(aliases_json)

        chutan = f"'{rec['chutan_date']}'" if rec['chutan_date'] else 'NULL'
        mixin = f"'{rec['mixin_date']}'" if rec['mixin_date'] else 'NULL'
        rec_amb_alias = escape_sql(rec['recommender_alias']) if rec['recommender_alias'] else 'NULL'
        rec_amb_real = escape_sql(rec['recommender_real_name']) if rec['recommender_real_name'] else 'NULL'
        self_amb_alias = escape_sql(rec['ambassador_alias']) if rec['ambassador_alias'] else 'NULL'
        self_amb_real = escape_sql(rec['ambassador_real_name']) if rec['ambassador_real_name'] else 'NULL'

        row_sql = (
            f"({escape_sql(rec['student_name'])}, "
            f"{aliases_val}, "
            f"{chutan}, "
            f"{mixin}, "
            f"{rec_amb_alias}, "
            f"{rec_amb_real}, "
            f"{rec['is_ambassador']}, "
            f"{self_amb_alias}, "
            f"{self_amb_real}, "
            f"{rec['ambassador_level']}, "
            f"{rec['is_duplicate']})"
        )
        insert_rows.append(row_sql)

    # 单次 INSERT 写入全部行：控制台整文件执行一次即可（无需 MCP/手工分批）
    output_lines = []
    output_lines.append("-- legacy_students 数据导入（整文件一次性执行）")
    output_lines.append("-- 生成时间: " + datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    output_lines.append("-- 使用 utf8mb4；若出现 琛→晨 等别字，多为执行端连接字符集非 UTF-8")
    output_lines.append("-- 云开发 MySQL：控制台 SQL 窗口粘贴本文件全文执行，或 mysql 客户端: SOURCE 本文件;")
    output_lines.append("SET NAMES utf8mb4;")
    output_lines.append("")
    single_sql = (
        f"INSERT INTO tiandao_culture.legacy_students {col_names} VALUES\n"
        + ",\n".join(insert_rows) + ";"
    )
    output_lines.append(single_sql)

    sql_content = "\n".join(output_lines)
    output_path = r'D:\project\cursor\work\xcx\scripts\legacy_students_data.sql'
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(sql_content)

    print(f"\n[INFO] SQL已写入: {output_path}")
    print(f"[INFO] 共 {len(insert_rows)} 行，单条 INSERT 全量")

    return final_records


if __name__ == '__main__':
    records = main()
