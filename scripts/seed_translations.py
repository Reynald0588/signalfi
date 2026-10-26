"""One-time seed for the checked-in Chinese translation cache."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

EVENT_TRANSLATIONS = {
    "587fbf3f893f": ("内塔尼亚胡提出用区块链规避潜在金融制裁", "以色列大选前，内塔尼亚胡称可借助区块链与加密货币应对潜在国际制裁，此举引发反对者及央行官员担忧。"),
    "9aafe294883b": ("Polkadot 钱包安全事件持续 20 个月，暴露快速提现另一面", "Polkadot 此前缩短提名人退出时间，使安全事件中可用于协调处置的窗口更短，资金暴露风险随之上升。"),
    "70b74ce998ed": ("阿根廷撤销对总统米莱 LIBRA 币事件的刑事调查", "法官认为米莱推广 LIBRA 代币的行为不构成欺诈，但该事件仍引发市场对其背书代币行为的关注。"),
    "87dbe7c3ca1b": ("Kraken 想成为你的银行，但谁来保护你的资金？", "Kraken 母公司计划通过收购芬兰 Saldo Finance Oy 进一步进入支付与银行业务，市场关注其资金保护和监管边界。"),
    "2a4da9007e76": ("Bitcoin Core 重写安全政策，应对 AI 快速发现漏洞", "开发者将对易被 AI 提示发现的漏洞立即回补并发布版本，减少过去对高风险漏洞的长时间保密流程。"),
    "1ecb723910d0": ("Circle 股东起诉特朗普，指阿联酋加密交易影响 USDC 业务", "Circle 股东指控特朗普家族相关阿联酋加密支付交易涉及利益冲突，并可能分流 USDC 业务；诉讼还涉及一笔 5 亿美元投资。"),
    "2ce2c00b2a1b": ("香港最大银行将稳定币接入 300 万个钱包", "汇丰在香港 PayMe 上线港元稳定币，测试银行发行的代币能否进入日常支付场景。"),
    "3c03f21061d8": ("Block 推出逼真语音 AI，引发惊叹与诈骗担忧", "市场对 Block 新语音 AI 的拟真程度反应分化：既惊叹于效果，也担心其被用于诈骗和欺骗；CZ 亦关注其在儿童教育中的应用。"),
    "87fd770b29a2": ("Initia 遭攻击后暂停区块链，据报道损失超 260 万美元", "安全人员发现未经授权的代币铸造及资产转移后，Initia 暂停一层网络和 Rollup，部分资金被转至以太坊。"),
    "d2ac36d2b4ba": ("Initia 因安全事件暂停网络，攻击者被指铸造代币", "链上数据显示约 270 万美元的 ETH 被转移，Initia 正在调查安全事件的影响范围。"),
    "fbe25a09f4ef": ("阿根廷法官裁定米莱等 11 人在 LIBRA 案中不构成犯罪", "法官在 60 页裁决中认定，米莱推广 LIBRA 代币本身不足以构成欺诈，未发现具有刑事相关性的欺骗行为。"),
    "ff2924234bf7": ("瑞典政府办公室封禁 ChatGPT 与 Claude，仅保留 Microsoft Copilot", "瑞典政府将从周一起在员工电脑上屏蔽 ChatGPT 和 Claude，仅允许通过安全审查的 Microsoft Copilot。"),
    "ae84e4a9253a": ("麦当劳、微软和谷歌反对代币化股票，但这未必意味着失败", "多家大型企业对在 SEC 创新豁免下的首个代币化证券交易场所表达反对，但这更多反映发行方的谨慎，而非对代币化本身的否定。"),
    "3f513353b4c0": ("美国参议员调查 Tether 与前特朗普加密顾问相关交易", "美国参议院常设调查小组委员会民主党领袖要求 Tether 负责人提供与前特朗普加密顾问相关交易的记录。"),
    "5258685b4e58": ("加密自托管真的适合初学者吗？", "近期硬件钱包安全事件再次引发讨论：多重签名与无助记词设计虽然降低部分门槛，但也带来新的风险。"),
    "baddd66e39ca": ("Kraken 撤销 Monero 支出问询，但仍保留 1,500 美元 30 天提现上限", "Kraken 联合 CEO 承认此前对 Monero 客户的合规问询缺乏依据后，交易所撤销相关要求，但个人用户仍受滚动提现额度限制。"),
    "5e828d66aaac": ("内塔尼亚胡考虑用加密方案应对以色列银行制裁风险", "以色列大选前，内塔尼亚胡表示已要求制定区块链方案，以应对银行系统可能遭遇的制裁，并提醒民众做好预案。"),
    "6a3d24455ba9": ("内塔尼亚胡寻求区块链方案，为潜在制裁做准备", "内塔尼亚胡称区块链可帮助以色列银行体系应对潜在制裁风险，相关表态正值大选前的敏感时期。"),
    "4744d77855b9": ("Bitcoin Core 加快安全修复，44% 受访节点仍运行不受支持版本", "Bitcoin Core 修改政策，允许对易被重新发现的高危漏洞快速回补到各维护版本；同时数据显示相当比例节点仍运行旧版本。"),
    "8985327c9b3c": ("Xapo CEO：比特币富裕持有者正转向贷款与收益策略", "Xapo Bank CEO 表示，随着投资习惯成熟，长期持有者越来越关注以 BTC 抵押借款和获取收益来扩大持仓。"),
    "e569456867d2": ("纽约州要求利用祈祷群诈骗的加密骗子赔偿 13 亿美元", "纽约州总检察长请求法院判令已离境的 NovaTech 创始人赔偿约 13.7 亿美元，并与四名主要推广者达成近 600 万美元和解。"),
    "1d39ce47e2fe": ("韩国央行希望将稳定币纳入外汇法，加密法案与税收争议升温", "韩国央行告知议员，计划今年起草外汇法修正案，将作为支付手段的稳定币纳入监管。"),
    "8ef02f06f195": ("Phantom 向美国用户上线 Kalshi 预测市场", "Phantom 用户将使用 CASH 稳定币进行交易，密歇根、内华达和华盛顿州将受到市场限制。"),
    "a4ca93de8f5f": ("新加坡、马来西亚和泰国央行扩大跨境稳定币合作", "马来西亚和泰国加入新加坡 BLOOM 计划，探索跨境稳定币和代币化存款结算，Ripple、Visa 和 Mastercard 参与其中。"),
}

EVENT_TRANSLATIONS.update({
    "84f49777384d": ("Keystone 称网站泄露硬件钱包购买者地址", "安全研究人员警告，泄露的收货信息可能让加密资产持有者面临定向诈骗和人身攻击风险。"),
    "d280925ea1c6": ("马斯克警告 AI 新云厂商，SpaceX 举债 400 亿美元采购芯片", "SpaceX 已举债 400 亿美元用于购买 GPU，马斯克同时预测规模较小的 AI 云服务商将出现大规模洗牌。"),
    "9a6d440e13d4": ("AI Agent 协助抢救以太坊 Glamsterdam 分叉；“Steal My Bitcoin”网站遭攻破", "以太坊研究人员搭建 AI Agent 留言板以协助抢救 Glamsterdam 分叉；另一项名为“Steal My Bitcoin”的网站被成功攻破。"),
    "ddd41548abcd": ("加拿大拟允许小额稳定币直接兑付，手续费上限 1%", "受覆盖的持有者可无最低金额限制地兑付稳定币，但储备市场流动性、每日额度和银行接入仍可能限制实际退出。"),
    "d29a7a2ce6c4": ("马斯克警告逾 200 家 AI 新云厂商面临淘汰", "Gartner 预测到 2030 年超过 80% 的专业云服务商将无法独立运营，马斯克则用“孔雀鱼级死亡”形容小型厂商的生存压力。"),
    "6762553e6f43": ("美联储会议前交易员降风险，比特币跌破 8 万美元", "随着亚洲市场 AI 交易再度受挫，ETH 与 XRP 领跌主要资产；高盛同时将韩国 KOSPI 目标下调 25%。"),
    "77961c5ec1c2": ("美国受害者被盗 3700 万美元经巴哈马银行流入 USDT", "检方指控相关资金通过银行账户转入 USDT，案件涉及 174 名已确认的美国受害者，目前尚未公布新的赔付金额。"),
    "ea51a0ad347d": ("比特币钱包漏洞：恶意服务器可在用户加速交易时盗取资金", "攻击者用伪造交易替换正常交易，诱导用户为更高手续费签字确认；至少一人在开发者修复漏洞前损失比特币。"),
    "335d73367c44": ("印度最大加密交易所因退役钱包流程失误承担 1600 万美元损失", "该交易所最初将可疑资金流出称为误报，随后确认损失 1600 万美元并表示将自行承担。"),
    "98922297fa4c": ("渣打支持的 Anchorpoint 称暂不急于推出零售稳定币", "这家由渣打与 Animoca Brands 合资的公司曾计划最早在 2026 年底面向零售用户，但 CEO 未重申该时间表。"),
    "5383fbc0dde5": ("Initia 攻击事件令 USDC 桥储备降至 63 美元", "Bitquery 将失败提现与 Initia 余额储备耗尽联系起来，项目方已公布修复和恢复计划。"),
    "499ca446d9df": ("CoinDCX 确认因退役钱包损失 1600 万美元", "CEO 此前曾称初步泄露报告“像是误报”，几天后交易所确认了与退役钱包相关的资金损失。"),
    "ddd90373aca1": ("比特币 ETF 结束两周净流出，单周回流 3.01 亿美元", "美国现货比特币 ETF 在连续三天净流入后遭遇较大赎回，但全周仍实现 3.01 亿美元净流入。"),
    "828df0e391ee": ("英国 FCA 在非约束性加密指引中提出个人钱包检查", "FCA 在咨询文件中将非托管钱包尽职调查列为良好实践，同时批评缺乏解释的第三方评分和僵化的资金追踪规则。"),
    "e7ef68cb8240": ("超 1100 万枚比特币无已知所有者，意味着什么", "观察人士认为，大量比特币存放在身份不明的钱包中，说明散户已长期参与市场，但这一解读仍存在重要限制。"),
    "29737368c3ee": ("今日加密市场发生了什么：热点与趋势汇总", "汇总当天影响比特币价格、区块链、DeFi、Web3 与加密监管的最新趋势和重要事件。"),
})
MARKET_TRANSLATIONS = {
    "Will Bitcoin dip to $70,000 by December 31, 2026?": "比特币会在 2026 年 12 月 31 日前跌破 70,000 美元吗？",
    "Will Bitcoin dip to $78,000 October 19-25?": "比特币会在 10 月 19 日至 25 日期间跌破 78,000 美元吗？",
    "Will Ethereum dip to $1,700 October 19-25?": "以太坊会在 10 月 19 日至 25 日期间跌破 1,700 美元吗？",
    "Will there be no change in Fed interest rates after the October 2026 meeting?": "2026 年 10 月美联储会议后利率会维持不变吗？",
    "Will the price of Bitcoin be above $84,000 on October 26?": "比特币在 10 月 26 日的价格会高于 84,000 美元吗？",
    "Will the price of Bitcoin be above $72,000 on October 26?": "比特币在 10 月 26 日的价格会高于 72,000 美元吗？",
    "Will the Fed increase interest rates by 25 bps after the October 2026 meeting?": "2026 年 10 月美联储会议后会加息 25 个基点吗？",
}


MARKET_TRANSLATIONS.update({
    "Will the price of Bitcoin be above $84,000 on October 26?": "比特币在 10 月 26 日的价格会高于 84,000 美元吗？",
    "Will the price of Bitcoin be above $72,000 on October 26?": "比特币在 10 月 26 日的价格会高于 72,000 美元吗？",
    "Will the Fed increase interest rates by 25 bps after the October 2026 meeting?": "2026 年 10 月美联储会议后会加息 25 个基点吗？",
})
def key(text: str) -> str:
    return hashlib.sha1(text.strip().encode("utf-8")).hexdigest()


def main() -> None:
    latest = json.loads((DATA / "latest.json").read_text(encoding="utf-8"))
    cache = {"title": {}, "summary": {}, "market": {}}
    for event in latest.get("events", []):
        translated = EVENT_TRANSLATIONS.get(event.get("id"))
        if not translated:
            continue
        title_zh, summary_zh = translated
        cache["title"][key(event["title"])] = title_zh
        cache["summary"][key(event["summary"])] = summary_zh
        event["title_zh"] = title_zh
        event["summary_zh"] = summary_zh
    for market in latest.get("prediction_markets", []):
        translated = MARKET_TRANSLATIONS.get(market.get("question", ""))
        if translated:
            cache["market"][key(market["question"])] = translated
            market["question_zh"] = translated
    (DATA / "translation_cache.json").write_text(json.dumps(cache, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    serialized = json.dumps(latest, ensure_ascii=False, indent=2) + "\n"
    (DATA / "latest.json").write_text(serialized, encoding="utf-8")
    (ROOT / "assets" / "latest-data.js").write_text("window.LATEST_DATA = " + json.dumps(latest, ensure_ascii=False) + ";\n", encoding="utf-8")
    print(f"seeded {len(cache['title'])} titles, {len(cache['summary'])} summaries, {len(cache['market'])} markets")


if __name__ == "__main__":
    main()



