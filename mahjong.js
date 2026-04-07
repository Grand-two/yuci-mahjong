/**
 * 榆次麻将 — 纯业务逻辑模块
 * 与 DOM 完全解耦，可独立测试。
 */

// ─── 骰子规则 ───────────────────────────────────────────

/**
 * 根据第一次掷骰点数之和，返回第二次掷骰的人。
 * 规则：
 *   5 / 9  → 庄家
 *   2 / 6 / 10 → 下家
 *   3 / 7 / 11 → 对家
 *   4 / 8 / 12 → 上家
 *
 * @param {number} sum 两枚骰子点数之和（2–12）
 * @returns {string} 掷骰人名称
 */
function getSecondRuller(sum) {
    if (sum === 5 || sum === 9)             return '庄家';
    if (sum === 2 || sum === 6 || sum === 10) return '下家';
    if (sum === 3 || sum === 7 || sum === 11) return '对家';
    return '上家'; // 4 / 8 / 12
}

/**
 * 根据两次掷骰总点数计算摸牌起始墩位。
 * 规则：从第二次掷骰人的牌墙右数第 totalPoints 墩跳过，
 *       从第 totalPoints + 1 墩开始摸牌。
 *
 * @param {number} firstSum  第一次骰子点数之和
 * @param {number} secondSum 第二次骰子点数之和
 * @returns {{ totalPoints: number, drawPosition: number, ruler: string }}
 */
function calcDrawPosition(firstSum, secondSum) {
    const totalPoints = firstSum + secondSum;
    return {
        totalPoints,
        drawPosition: totalPoints + 1,
        ruler: getSecondRuller(firstSum),
    };
}

// ─── 番数计算 ────────────────────────────────────────────

/**
 * 计算本局番数。
 *
 * @param {object} opts 胡牌选项
 * @param {boolean} [opts.pinghu]      平胡（基础2番，必须存在）
 * @param {boolean} [opts.menqing]     门清 +1
 * @param {boolean} [opts.duanyao]     断幺 +1
 * @param {boolean} [opts.kanzhang]    坎张 +1
 * @param {boolean} [opts.bianzhang]   边张 +1
 * @param {boolean} [opts.diandiao]    单钓 +1
 * @param {boolean} [opts.pengpenghu]  碰碰胡 +5
 * @param {boolean} [opts.qidui]       七对 +7
 * @param {boolean} [opts.yitiaolong]  一条龙 +10
 * @param {boolean} [opts.qingyise]    清一色 +10
 * @param {boolean} [opts.ziyise]      字一色 +20
 * @param {boolean} [opts.longtaolong] 龙套龙 +20
 * @param {boolean} [opts.zhuangjia]   坐庄 +1
 * @param {boolean} [opts.zimo]        自摸（全部×2，在加算后）
 * @param {number}  [opts.minggang]    明杠数量（每个+1）
 * @param {number}  [opts.angang]      暗杠数量（每个+2）
 * @param {boolean} [opts.quanbao]     全包（未听牌点炮）+1
 * @returns {{ total: number, details: Array<{name:string, value:string}> }}
 */
function calcScore(opts = {}) {
    let total = 0;
    const details = [];

    // 基本牌型
    if (opts.pinghu) {
        total += 2;
        details.push({ name: '平胡基础', value: '2番' });
    }

    // 普通番型
    const simple = [
        ['menqing',   '门清',   1],
        ['duanyao',   '断幺',   1],
        ['kanzhang',  '坎张',   1],
        ['bianzhang', '边张',   1],
        ['diandiao',  '单钓',   1],
    ];
    for (const [key, name, pts] of simple) {
        if (opts[key]) {
            total += pts;
            details.push({ name, value: `+${pts}番` });
        }
    }

    // 特殊牌型
    const special = [
        ['pengpenghu',  '碰碰胡', 5],
        ['qidui',       '七对',   7],
        ['yitiaolong',  '一条龙', 10],
        ['qingyise',    '清一色', 10],
        ['ziyise',      '字一色', 20],
        ['longtaolong', '龙套龙', 20],
    ];
    for (const [key, name, pts] of special) {
        if (opts[key]) {
            total += pts;
            details.push({ name, value: `+${pts}番` });
        }
    }

    // 坐庄
    if (opts.zhuangjia) {
        total += 1;
        details.push({ name: '坐庄', value: '+1番' });
    }

    // 杠牌：明杠每个+1，暗杠每个+2
    const minggang = opts.minggang || 0;
    const angang   = opts.angang   || 0;
    if (minggang > 0 || angang > 0) {
        const gangScore = minggang * 1 + angang * 2;
        total += gangScore;
        const gangDesc = [];
        if (minggang > 0) gangDesc.push(`明杠×${minggang}`);
        if (angang   > 0) gangDesc.push(`暗杠×${angang}`);
        details.push({ name: `杠牌（${gangDesc.join('+')}）`, value: `+${gangScore}番` });
    }

    // 全包
    if (opts.quanbao) {
        total += 1;
        details.push({ name: '全包', value: '+1番' });
    }

    // 确保平胡最低2番
    if (total === 0) {
        total = 2;
        details.push({ name: '平胡基础', value: '2番' });
    }

    // 自摸 ×2（最后乘）
    if (opts.zimo) {
        total *= 2;
        details.push({ name: '自摸（×2）', value: '×2' });
    }

    return { total, details };
}

// ─── 流局判定 ─────────────────────────────────────────────

/**
 * 判断是否流局（黄庄）。
 * 规则：剩余牌墩数 ≤ 杠数对应的安全墩数时为流局。
 *
 * 杠数 → 最少需保留的牌墩数
 *   0杠 → 6墩（约定默认）
 *   1杠 → 7墩
 *   2杠 → 8墩
 *   3杠 → 9墩
 *   4杠 → 10墩
 *
 * @param {number} remainingDun 当前剩余牌墩数
 * @param {number} gangCount    已开杠数（0–4）
 * @returns {boolean}
 */
function isHuangZhuang(remainingDun, gangCount) {
    const minDun = 6 + gangCount;
    return remainingDun <= minDun;
}

module.exports = { getSecondRuller, calcDrawPosition, calcScore, isHuangZhuang };
