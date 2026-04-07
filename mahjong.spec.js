/**
 * 榆次麻将 — Spec 测试
 *
 * 什么是 Spec 编程？
 * ─────────────────
 * Spec（规格/规约）编程，又称行为驱动开发（BDD，Behavior-Driven Development），
 * 是一种先用自然语言写清楚"期望行为"，再用代码把这些期望变成可执行测试的开发方式。
 *
 * 核心思想：
 *   describe('被测对象')   → 描述你在测什么
 *     it('应该…')          → 一个具体的期望（spec / example）
 *       expect(实际值).toBe(期望值)  → 断言
 *
 * 好处：
 *   1. 测试即文档——读 spec 就能看懂业务规则，无需另写说明
 *   2. 驱动设计——先写 spec，再写实现，倒逼代码保持纯函数、易测
 *   3. 快速回归——改了代码，跑一遍 spec 就知道有没有破坏原有逻辑
 *
 * 本文件针对 mahjong.js 中的三大业务模块编写完整 spec：
 *   1. getSecondRuller — 骰子点数决定下一位掷骰人
 *   2. calcScore       — 番数计算
 *   3. isHuangZhuang   — 流局（黄庄）判定
 */

const {
    getSecondRuller,
    calcDrawPosition,
    calcScore,
    isHuangZhuang,
} = require('./mahjong');

// ═══════════════════════════════════════════════════════════
// 一、骰子规则 — 第二次掷骰人
// ═══════════════════════════════════════════════════════════

describe('getSecondRuller — 根据第一次骰子点数之和，确定第二次掷骰人', () => {

    describe('当点数和为 5 或 9 时（庄家方向）', () => {
        it('点数和为 5，应返回"庄家"', () => {
            expect(getSecondRuller(5)).toBe('庄家');
        });
        it('点数和为 9，应返回"庄家"', () => {
            expect(getSecondRuller(9)).toBe('庄家');
        });
    });

    describe('当点数和为 2、6 或 10 时（下家方向）', () => {
        it('点数和为 2，应返回"下家"', () => {
            expect(getSecondRuller(2)).toBe('下家');
        });
        it('点数和为 6，应返回"下家"', () => {
            expect(getSecondRuller(6)).toBe('下家');
        });
        it('点数和为 10，应返回"下家"', () => {
            expect(getSecondRuller(10)).toBe('下家');
        });
    });

    describe('当点数和为 3、7 或 11 时（对家方向）', () => {
        it('点数和为 3，应返回"对家"', () => {
            expect(getSecondRuller(3)).toBe('对家');
        });
        it('点数和为 7，应返回"对家"', () => {
            expect(getSecondRuller(7)).toBe('对家');
        });
        it('点数和为 11，应返回"对家"', () => {
            expect(getSecondRuller(11)).toBe('对家');
        });
    });

    describe('当点数和为 4、8 或 12 时（上家方向）', () => {
        it('点数和为 4，应返回"上家"', () => {
            expect(getSecondRuller(4)).toBe('上家');
        });
        it('点数和为 8，应返回"上家"', () => {
            expect(getSecondRuller(8)).toBe('上家');
        });
        it('点数和为 12，应返回"上家"', () => {
            expect(getSecondRuller(12)).toBe('上家');
        });
    });

    it('所有合法骰子点数（2–12）都应有明确结果', () => {
        const validResults = ['庄家', '下家', '对家', '上家'];
        for (let sum = 2; sum <= 12; sum++) {
            expect(validResults).toContain(getSecondRuller(sum));
        }
    });
});

// ─── calcDrawPosition ───────────────────────────────────

describe('calcDrawPosition — 根据两次骰子点数计算摸牌位置', () => {

    it('第一次 3+4=7，第二次 2+3=5：总点数应为 12，起始墩应为 13', () => {
        const result = calcDrawPosition(7, 5);
        expect(result.totalPoints).toBe(12);
        expect(result.drawPosition).toBe(13);
    });

    it('第一次点数为 9，掷骰人应为庄家', () => {
        const result = calcDrawPosition(9, 4);
        expect(result.ruler).toBe('庄家');
    });

    it('两次点数较小（2+2=4）时总点数为 4，摸牌墩为 5', () => {
        const result = calcDrawPosition(2, 2);
        expect(result.totalPoints).toBe(4);
        expect(result.drawPosition).toBe(5);
    });

    it('两次点数最大（12+12=24）时总点数为 24，摸牌墩为 25', () => {
        const result = calcDrawPosition(12, 12);
        expect(result.totalPoints).toBe(24);
        expect(result.drawPosition).toBe(25);
    });
});

// ═══════════════════════════════════════════════════════════
// 二、番数计算
// ═══════════════════════════════════════════════════════════

describe('calcScore — 番数计算', () => {

    describe('基础规则', () => {
        it('什么都不选时，默认给 2 番（平胡保底）', () => {
            const { total } = calcScore({});
            expect(total).toBe(2);
        });

        it('只选平胡，应得 2 番', () => {
            const { total } = calcScore({ pinghu: true });
            expect(total).toBe(2);
        });

        it('返回结果中应包含 total 和 details 两个字段', () => {
            const result = calcScore({ pinghu: true });
            expect(result).toHaveProperty('total');
            expect(result).toHaveProperty('details');
            expect(Array.isArray(result.details)).toBe(true);
        });
    });

    describe('普通番型叠加', () => {
        it('平胡 + 门清 = 3 番', () => {
            const { total } = calcScore({ pinghu: true, menqing: true });
            expect(total).toBe(3);
        });

        it('平胡 + 断幺 = 3 番', () => {
            const { total } = calcScore({ pinghu: true, duanyao: true });
            expect(total).toBe(3);
        });

        it('平胡 + 坎张 = 3 番', () => {
            const { total } = calcScore({ pinghu: true, kanzhang: true });
            expect(total).toBe(3);
        });

        it('平胡 + 边张 = 3 番', () => {
            const { total } = calcScore({ pinghu: true, bianzhang: true });
            expect(total).toBe(3);
        });

        it('平胡 + 单钓 = 3 番', () => {
            const { total } = calcScore({ pinghu: true, diandiao: true });
            expect(total).toBe(3);
        });

        it('平胡 + 门清 + 断幺 = 4 番', () => {
            const { total } = calcScore({ pinghu: true, menqing: true, duanyao: true });
            expect(total).toBe(4);
        });
    });

    describe('特殊牌型', () => {
        it('碰碰胡单独 = 5 番', () => {
            const { total } = calcScore({ pengpenghu: true });
            expect(total).toBe(5);
        });

        it('七对单独 = 7 番', () => {
            const { total } = calcScore({ qidui: true });
            expect(total).toBe(7);
        });

        it('一条龙单独 = 10 番', () => {
            const { total } = calcScore({ yitiaolong: true });
            expect(total).toBe(10);
        });

        it('清一色单独 = 10 番', () => {
            const { total } = calcScore({ qingyise: true });
            expect(total).toBe(10);
        });

        it('字一色单独 = 20 番', () => {
            const { total } = calcScore({ ziyise: true });
            expect(total).toBe(20);
        });

        it('龙套龙单独 = 20 番', () => {
            const { total } = calcScore({ longtaolong: true });
            expect(total).toBe(20);
        });
    });

    describe('坐庄奖励', () => {
        it('平胡 + 坐庄 = 3 番', () => {
            const { total } = calcScore({ pinghu: true, zhuangjia: true });
            expect(total).toBe(3);
        });
    });

    describe('自摸翻倍', () => {
        it('平胡（2番）自摸后 = 4 番', () => {
            const { total } = calcScore({ pinghu: true, zimo: true });
            expect(total).toBe(4);
        });

        it('清一色（10番）自摸后 = 20 番', () => {
            const { total } = calcScore({ qingyise: true, zimo: true });
            expect(total).toBe(20);
        });

        it('平胡+坐庄（3番）自摸后 = 6 番', () => {
            const { total } = calcScore({ pinghu: true, zhuangjia: true, zimo: true });
            expect(total).toBe(6);
        });

        it('details 中应包含"自摸（×2）"条目', () => {
            const { details } = calcScore({ pinghu: true, zimo: true });
            const zimoEntry = details.find(d => d.name === '自摸（×2）');
            expect(zimoEntry).toBeDefined();
            expect(zimoEntry.value).toBe('×2');
        });
    });

    describe('杠牌加番', () => {
        it('明杠 1 个 = +1 番（在平胡基础上）', () => {
            const { total } = calcScore({ pinghu: true, minggang: 1 });
            expect(total).toBe(3);
        });

        it('明杠 2 个 = +2 番', () => {
            const { total } = calcScore({ pinghu: true, minggang: 2 });
            expect(total).toBe(4);
        });

        it('暗杠 1 个 = +2 番', () => {
            const { total } = calcScore({ pinghu: true, angang: 1 });
            expect(total).toBe(4);
        });

        it('暗杠 2 个 = +4 番', () => {
            const { total } = calcScore({ pinghu: true, angang: 2 });
            expect(total).toBe(6);
        });

        it('明杠 1 + 暗杠 1 = +3 番', () => {
            const { total } = calcScore({ pinghu: true, minggang: 1, angang: 1 });
            expect(total).toBe(5);
        });

        it('杠牌后再自摸，杠番也应参与翻倍', () => {
            // 平胡(2) + 明杠1(1) = 3，自摸×2 = 6
            const { total } = calcScore({ pinghu: true, minggang: 1, zimo: true });
            expect(total).toBe(6);
        });
    });

    describe('全包', () => {
        it('平胡 + 全包 = 3 番', () => {
            const { total } = calcScore({ pinghu: true, quanbao: true });
            expect(total).toBe(3);
        });
    });

    describe('综合场景', () => {
        it('清一色 + 七对 + 坐庄 + 自摸 = (10+7+1)×2 = 36 番', () => {
            const { total } = calcScore({
                qingyise: true,
                qidui: true,
                zhuangjia: true,
                zimo: true,
            });
            expect(total).toBe(36);
        });

        it('龙套龙 + 清一色 + 碰碰胡 + 坐庄 + 自摸 = (20+10+5+1)×2 = 72 番', () => {
            const { total } = calcScore({
                longtaolong: true,
                qingyise: true,
                pengpenghu: true,
                zhuangjia: true,
                zimo: true,
            });
            expect(total).toBe(72);
        });
    });
});

// ═══════════════════════════════════════════════════════════
// 三、流局（黄庄）判定
// ═══════════════════════════════════════════════════════════

describe('isHuangZhuang — 流局（黄庄）判定', () => {

    describe('无杠时（保底 6 墩）', () => {
        it('剩余 7 墩，无杠：未流局', () => {
            expect(isHuangZhuang(7, 0)).toBe(false);
        });
        it('剩余 6 墩，无杠：流局', () => {
            expect(isHuangZhuang(6, 0)).toBe(true);
        });
        it('剩余 3 墩，无杠：流局', () => {
            expect(isHuangZhuang(3, 0)).toBe(true);
        });
    });

    describe('有 1 杠时（保底 7 墩）', () => {
        it('剩余 8 墩，1杠：未流局', () => {
            expect(isHuangZhuang(8, 1)).toBe(false);
        });
        it('剩余 7 墩，1杠：流局', () => {
            expect(isHuangZhuang(7, 1)).toBe(true);
        });
    });

    describe('有 2 杠时（保底 8 墩）', () => {
        it('剩余 9 墩，2杠：未流局', () => {
            expect(isHuangZhuang(9, 2)).toBe(false);
        });
        it('剩余 8 墩，2杠：流局', () => {
            expect(isHuangZhuang(8, 2)).toBe(true);
        });
    });

    describe('有 3 杠时（保底 9 墩）', () => {
        it('剩余 10 墩，3杠：未流局', () => {
            expect(isHuangZhuang(10, 3)).toBe(false);
        });
        it('剩余 9 墩，3杠：流局', () => {
            expect(isHuangZhuang(9, 3)).toBe(true);
        });
    });

    describe('有 4 杠时（保底 10 墩）', () => {
        it('剩余 11 墩，4杠：未流局', () => {
            expect(isHuangZhuang(11, 4)).toBe(false);
        });
        it('剩余 10 墩，4杠：流局', () => {
            expect(isHuangZhuang(10, 4)).toBe(true);
        });
    });

    it('剩余 0 墩时无论杠数如何，始终流局', () => {
        for (let g = 0; g <= 4; g++) {
            expect(isHuangZhuang(0, g)).toBe(true);
        }
    });
});
