/**
 * 排座管理工具脚本
 * 座位布局计算、拖拽管理、颜色工具、Word 导出
 */

// ==================== 座位布局计算 ====================

const SeatingUtils = {
  /**
   * 计算座位在桌子四边的分布数量
   * 规则：上1个、下1个、左 ceil((n-2)/2)、右 floor((n-2)/2)
   */
  calculateSeatDistribution(seatsPerDesk) {
    const remaining = Math.max(0, seatsPerDesk - 2);
    return {
      top: 1,
      bottom: 1,
      left: Math.ceil(remaining / 2),
      right: Math.floor(remaining / 2)
    };
  },

  /**
   * 将座位索引（从0开始）映射到桌面位置
   * 0=上, 1~left=左, left+1~left+right=右, 最后=下
   */
  getSeatSide(seatIndex, seatsPerDesk) {
    const dist = this.calculateSeatDistribution(seatsPerDesk);
    if (seatIndex === 0) return 'top';
    if (seatIndex <= dist.left) return 'left';
    if (seatIndex <= dist.left + dist.right) return 'right';
    return 'bottom';
  },

  /** 颜色变亮 */
  lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 +
      (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  },

  /** 颜色变暗 */
  darkenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return '#' + (0x1000000 +
      (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
      (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
      (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
  },

  /** 预设桌布颜色 */
  PRESET_COLORS: [
    '#228B22', '#006400', '#2E8B57', '#8B4513',
    '#800020', '#1B4D3E', '#36454F', '#191970',
    '#4A0E4E', '#8B0000', '#2F4F4F', '#483D8B'
  ],

  /** 岗位标签颜色映射 */
  getPositionColor(positionName) {
    const colorMap = {
      '辅导员': '#e34d59',
      '会务义工': '#0052d9',
      '沙龙组织': '#e37318',
      '其他': '#029cd4'
    };
    return colorMap[positionName] || '#8b8b8b';
  },

  // ==================== Word 导出 ====================

  /**
   * 导出学员信息 Word
   * 需要全局加载 docx 库（通过 CDN）
   */
  async exportStudentInfoWord(data) {
    const { scheduleInfo, desks, positions } = data;
    if (typeof docx === 'undefined') {
      throw new Error('docx 库未加载');
    }

    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } = docx;
    const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: '999999' };
    const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

    const children = [];

    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [new TextRun({
        text: `${scheduleInfo.course_name || ''} ${scheduleInfo.period || ''} 学员座位表`,
        bold: true, size: 32, font: 'Microsoft YaHei'
      })]
    }));

    children.push(new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({
        text: `上课日期：${scheduleInfo.class_date || ''} | 地点：${scheduleInfo.class_location || ''}`,
        size: 22, font: 'Microsoft YaHei', color: '666666'
      })]
    }));

    for (const desk of desks) {
      children.push(new Paragraph({
        spacing: { before: 300, after: 100 },
        children: [new TextRun({
          text: `第 ${desk.deskNumber} 桌`,
          bold: true, size: 26, font: 'Microsoft YaHei'
        })]
      }));

      if (desk.students.length === 0) {
        children.push(new Paragraph({
          children: [new TextRun({ text: '（暂无学员）', size: 22, color: '999999' })]
        }));
        continue;
      }

      const headerRow = new TableRow({
        children: ['座位号', '姓名', '手机号', '岗位'].map(text =>
          new TableCell({
            borders,
            width: { size: 2250, type: WidthType.DXA },
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text, bold: true, size: 20, font: 'Microsoft YaHei' })]
            })]
          })
        )
      });

      const dataRows = desk.students.map(s =>
        new TableRow({
          children: [
            String(s.seat_number),
            s.user_name || '',
            s.user_phone || '',
            positions[s.user_id] || ''
          ].map(text =>
            new TableCell({
              borders,
              width: { size: 2250, type: WidthType.DXA },
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text, size: 20, font: 'Microsoft YaHei' })]
              })]
            })
          )
        })
      );

      children.push(new Table({
        width: { size: 9000, type: WidthType.DXA },
        rows: [headerRow, ...dataRows]
      }));
    }

    const doc = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `座位表_${scheduleInfo.course_name || ''}_${scheduleInfo.period || ''}.docx`);
  },

  /**
   * 导出签到表 Word
   */
  async exportSignInSheetWord(data) {
    const { scheduleInfo, desks } = data;
    if (typeof docx === 'undefined') {
      throw new Error('docx 库未加载');
    }

    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } = docx;
    const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: '999999' };
    const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

    const children = [];

    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [new TextRun({
        text: `${scheduleInfo.course_name || ''} ${scheduleInfo.period || ''} 签到表`,
        bold: true, size: 32, font: 'Microsoft YaHei'
      })]
    }));

    children.push(new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({
        text: `上课日期：${scheduleInfo.class_date || ''} | 地点：${scheduleInfo.class_location || ''}`,
        size: 22, font: 'Microsoft YaHei', color: '666666'
      })]
    }));

    for (const desk of desks) {
      children.push(new Paragraph({
        spacing: { before: 300, after: 100 },
        children: [new TextRun({
          text: `第 ${desk.deskNumber} 桌`,
          bold: true, size: 26, font: 'Microsoft YaHei'
        })]
      }));

      if (desk.students.length === 0) {
        children.push(new Paragraph({
          children: [new TextRun({ text: '（暂无学员）', size: 22, color: '999999' })]
        }));
        continue;
      }

      const headerRow = new TableRow({
        children: ['序号', '姓名', '签到'].map(text =>
          new TableCell({
            borders,
            width: { size: 3000, type: WidthType.DXA },
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text, bold: true, size: 20, font: 'Microsoft YaHei' })]
            })]
          })
        )
      });

      const dataRows = desk.students.map((s, idx) =>
        new TableRow({
          children: [String(idx + 1), s.user_name || '', ''].map(text =>
            new TableCell({
              borders,
              width: { size: 3000, type: WidthType.DXA },
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 60, after: 60 },
                children: [new TextRun({ text, size: 20, font: 'Microsoft YaHei' })]
              })]
            })
          )
        })
      );

      children.push(new Table({
        width: { size: 9000, type: WidthType.DXA },
        rows: [headerRow, ...dataRows]
      }));
    }

    const doc = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `签到表_${scheduleInfo.course_name || ''}_${scheduleInfo.period || ''}.docx`);
  }
};

window.SeatingUtils = SeatingUtils;
