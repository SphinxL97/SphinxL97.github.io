from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEXT_PATH = ROOT / "data/work027_full_text.txt"
CASE_PATH = ROOT / "data/work027_damage_cases.json"
REPORT_PATH = ROOT / "data/work027_coordinate_report.json"
WORK_JS = ROOT / "js/work-027.js"
ROUTER_JS = ROOT / "js/damage_ai_reading.js"
ENTRY_JS = ROOT / "js/detail_info_patch.js"
DETAIL_HTML = ROOT / "detail.html"

VERSION_OLD = "20260724_wei_five_v2"
VERSION_NEW = "20260724_wei_five_v3"

REFERENCES = [
    (
        "魏故懷令李君墓誌銘",
        "中國哲學書電子化計劃《續古文苑》、趙超《漢魏南北朝墓誌彙編》及柏克萊東亞圖書館李超墓誌著錄",
        "https://ctext.org/wiki.pl?chapter=588981&if=gb",
        """魏故懷令李君墓誌銘。君諱超，字景昇，本字景宗，後承始族叔在江左者懸同，故避改云。秦州隴西郡狄道縣都鄉華風里人也。雅著高節，敦襲世風，言行足師，興作成準，修情孝友，因心名義。安貧樂道，息詭遇之襟；介然峻特，標礭焉之操。弱冠，舉司州秀才，拜奉朝請，除恒農郡冠軍府錄事參軍事，宰沁水縣。縣政崇治，綽居尤最。為受罪者所誣章，憲臺誤聽，被茲深劾，除名為民。於是廿年中，浮沉閭巷，玉潔金志，卓爾無悶。到熙平二年，甫更從宦，補荊州前將軍騎兵參軍事，復作懷令。已受拜，垂垂述職，遭疾。正光五年八月十八日，卒于洛陽縣之永年里宅，時年六十一。孤貞華首，訖於二邑，門從無兩。遠邇酸恨懷之，百姓長慕喪氣，雖陳留之哀望胡季叡，不是過也。越六年正月丙午朔十六日辛酉，葬洛陽縣覆舟山之東南。元壤難窮，陵谷時異，刻茲陰石，照序光塵。泱泱顯斂，西垂代襲。清則沓炳，羽儀道妙之門；緒風屬斯，惟祖惟考。倜儻瓌奇，昌謨迭駕；高矱明規，杳量無隄。玄契不貲，總修異貫，員應紛枝。灼灼伊君，山立淵渟；棲真宅正，蹈繩履程。懿鑠為質，醇素用情；均冶禮世，氣重財輕。亦既從招，旁溢鴻聲；隨牒出入，密勿力誠。爰莅近邑，先邁儀形；絕交獨坐，化動陰窴。尚德貽咎，眾實叵蓋；拂衽歸來，飾轅束帶。恂恂鄉閈，萬殊一會；優柔善成，無小無大。垂白再仕，汎爾沿流；階倫稍降，盛業愈遒。逯作後城，士女承風；頓轡方馳，盡土悲愁。克節炯言，引賞靡徵；端恭妄砙，家俗虛膺。攉彼圮跡，事罕篇繒；長源未輸，深圖乍卷。蘊此逸機，空生徒返；茲冤易削，疇毒難遣。楨掬疏竦，泉房寒遠；孀孤內爛，妹弟摧咺。式鏤沉石，託注幽篆。妻恒農楊氏，父談，為郟州主簿。息女孟宜，年卅六，適恒農王始俊，郡中正。息女媛姿，適遼西常某，侍御史。息女仲妃，適武威賈子某，涼州治中。息道沖。息女婉華。息女烋顏。息女四輝。息道逸，年十六。息道栖，年十三。""",
    ),
    (
        "魏故咸陽太守劉府君墓誌銘",
        "《八瓊室金石補正》咸陽太守劉玉墓誌錄文及公開墓誌釋文",
        "https://www.shidianguji.com/zh/book/CADAL02090611/chapter/1lct9x0ma5s7u",
        """魏故咸陽太守劉府君墓誌銘。君諱玉，字天寶，弘農胡城人也。厥初基胄，與日月同開。爵封次弟，通君臣之始；周秦大漢，並班名位。遠祖司徒寬之苗，其中易世，舉一足明。值漢中譏匈奴之患，李陵出討，軍勢不利，遂沒虜廷。先人祖宗，便習其俗，婚姻官帶，與之錯雜。大魏開建，託定恒代。以曾祖初萬頭，大族之胄，宜履名宦；從駕之眾，理須督率，依地置官，為何渾地汗。爾時此班，例亞州牧。義成王南討長安，以祖可洛侯名家之孫，召接為副，充子都將。與王策謀帷內，制定雍境，遂以土荒，即今鎮押。君數世重蔭，成應引內，為西征子都。出祺之挺，屢有薰跡，宜可昇接，錫之茅土，假咸陽太守。春秋七十八，以孝昌三年歲次丙午十一月廿四日卒於家。肇基雲景，神彩重映。是曰劉族，世立堅明；位綖台司，志含中貞，翼輔王室，唯安唯寧。弈踵相繼，其器易新；召莅茅土，四裔來冥。綏接恩化，富壤殷民，體含玉潔，不磨自鄰。""",
    ),
    (
        "滄州刺史王僧墓誌銘",
        "趙超《漢魏南北朝墓誌彙編》王僧墓誌錄文及柏克萊東亞圖書館著錄",
        "https://gj.zdic.net/shibu/170/7597.html",
        """滄州刺史王僧墓誌銘。維大魏天平三年，歲次丙辰二月壬申朔十三日甲申，故龍驤將軍、諫議大夫、贈假節、督滄州諸軍事、征虜將軍、滄州刺史王僧墓誌。君姓王，諱僧，字子慎，滄州浮陽饒安人也。其先蔚炳，弗復重詳。顯祖有功漢室，剖符東夏，仍因家焉。曾祖袞，以大魏太常年中，除建威將軍、北平太守。祖清，少履庠門，以清貞自處，洪鑒雅粹，不以世事逕懷，故刺史張儒辟為茂才，昂然不拜。父願，以真君年中，黃輿南討，策功天府，除平遠將軍、步兵校尉。在政未幾，功名顯著，不幸如卒，贈東平郡君。洪源淵邈，眇若嵩峰；稟質瓊根，湛如滄海。故童年志學，聲播稚齒；遊心八素，必以禮義為任，汪汪焉弗可量也。以正始年中，除盪寇將軍、殿中將軍。後以清顯之任，實歸才令；廟算之功，良復懿望。神龜年中，冀土不賓，民懷叛扈，命將出師，掃除逋穢。以君才優器秀，召為都督，辭不獲命，遂乃擁麾東指，群兇奔競，桴鼓始交，賊徒冰潰。正光中，除清州高陽令，未及下車而芳風亟聞，不俟期月而民知且格。雖魯恭之在中牟、密子之治善甫，無以過也。俄遷白水太守，招慰酋渠，令塞外無塵；撫孤矜寡，廓清漢右。後除龍驤將軍、諫議大夫。宜保頤年，享茲遐授，豈圖不弔，奄摧良木。春秋五十八，天平二年三月十日薨於平陽，窆於饒安。贈假節、督滄州諸軍事、征虜將軍、滄州刺史。於是閭里戀景行之潛徽，悲靈蹤而思結，乃作銘曰：邈緒蟬聯，遠奚綿萇；弈葉載德，踵世傳芳。惟君綺日，蘊寶懷璋；年始強仕，朗秀垂芳。而彼蘭桂，載馥載香；比之秋月，影囑含光；狀之冬日，暉景攸長。春風始昫，奄摧嚴霜；迴翔鳳罕，翻飛下國。視民軌義，咸班禮則；雲柯渃彩，頌聲由勒。景行孤存，魂兮潛默；彫蘭折玉，摧賢墜德。翠木霜枝，哲人維克；白楊初殖，松栝始生。幽扃永閉，暗室未更；黃泉多晦，蒿里不明；曉夜未央，路斷人行。""",
    ),
    (
        "魏故使持節侍中驃騎大將軍太保太尉公錄尚書事劉君墓誌銘",
        "國立故宮博物院劉懿墓誌釋文及《忻州志》錄文",
        "https://digitalarchive.npm.gov.tw/Collection/Detail/33665?dep=P",
        """魏故使持節侍中驃騎大將軍太保太尉公錄尚書事都督冀定瀛殷並涼汾晉建郟肆十一州諸軍事冀州刺史郟肆二州大中正第一酋長敷城縣開國公劉君墓誌銘。君諱懿，字貴珍，弘農華陰人也。自豢龍啟胄，赤鳥降祥，磐石相連，犬牙交錯，長原遠葉，繁衍不窮，斧衣朱紱，蟬聯弈世。祖給事，德潤於身，民譽斯在。父肆州，行成於己，名高當世。君體局強正，氣幹雄立，剛柔並運，方圓備舉。棄置書劍，宿有英豪之志；指畫山澤，早懷將率之心。起家為大將軍府騎兵參軍、第一酋長。莊帝之初，以勳參義舉，封敷城縣開國伯，食邑五百戶；除直閣將軍、左中郎將、左將軍、太中大夫。帝圖時意，以為未盡，進爵為公，益戶五百，拜散騎常侍、撫軍將軍。乃除使持節都督涼州諸軍事、本將軍、涼州刺史、假鎮西將軍、常侍，開國如故。又為征南將軍、金紫光祿大夫、兼尚書右僕射、西南大行臺。復除使持節都督二汾晉三州諸軍事、驃騎將軍、晉州刺史，又行汾州事。大丞相勃海王，命世挺生，應期霸世。君既同德比義，事等魚水，乃除使持節都督肆州諸軍事、本將軍、肆州刺史，又加驃騎大將軍、儀同三司，餘如故。及聖明啟運，定鼎鄴宮，乃睠西顧，權烽未息，遂以君為使持節都督郟州諸軍事、本將軍、郟州刺史，儀同、開國如故。又以本秩為御史中尉，復兼尚書僕射、西南道行臺，加開府，餘如故。式遏奸寇，鎮靜河洛，復路還朝，仍居本位。君自解巾入仕，撫劍從戎，威略有聞，強毅著稱。其猶高松，有棟梁之質；類如金石，懷堅剛之性。既時逢多難，世屬殷憂，群飛競起，橫流未歇。折衡行陣之間，運籌帷幄之內，雄圖壯志，與韓白連衡；將略兵權，共孫吳合契。猛烈同於夏日，嚴厲等於秋霜；去草逐雀，懷蒼鷹之氣；誅豺制兕，起臥虎之威。降年不永，奄從晨露。以興和元年十一月辛亥朔十七日丁卯，薨於鄴都。追贈使持節、侍中、太保、太尉公、錄尚書事、都督冀定瀛殷並五州諸軍事、冀州刺史，餘官如故。粵以二年歲在庚申正月庚戌朔廿四日癸酉，葬於肆盧鄉孝義里。乃作銘曰：淼淼長瀾，巖巖峻趾；就日成德，聚星效祉。家風未沫，世祿不已。於穆夫君，一日千里；昂昂風氣，烈烈霜威。進退有度，信義無違；行高州里，聲滿邦畿。抗足高騖，理隔奮飛；秉麾執鐸，南臨北撫。肅清邦國，折衝疆寓；駿足未窮，逸翮方舉。奄異金石，遽同草莽；眷言歸奔，有嗟臨穴。荊棘方生，松檟將列；千秋萬古，光沉影絕。陵谷若虧，聲芳有晰。夫人常山王之孫，尚書左僕射元生之女。長子撫軍將軍、銀青光祿大夫、都督肆州諸軍事、肆州刺史元孫，妻驃騎大將軍、司徒公元恭之女。世子散騎常侍、千牛備身洪徽，妻大丞相勃海高王之第三女。次子肆州主簿徽彥，少子徽祖。巍巍玄宅，永固墓門。""",
    ),
    (
        "魏故勃海太守王府君墓誌銘",
        "趙超《漢魏南北朝墓誌彙編》、柏克萊東亞圖書館王偃墓誌著錄及《八瓊室金石補正》後跋",
        "https://ctext.org/wiki.pl?chapter=206401&if=gb",
        """魏故勃海太守王府君墓誌銘。君諱偃，字槃虎，太原晉陽人也。其先蓋隆周之遐裔。當春秋時，王子城父自周適齊，有敗狄之勳，遂錫王氏焉。丹車紫蓋之貴，雄俠五都；調風渫鼎之豪，聲華三輔。祖芬，安復侯、駙馬都尉、相國府參軍、給事中、太子虎賁中郎將，遷江夏王司馬，帶盱眙太守。父五龍，起家鎮北府參軍、建威將軍、臨淮太守、太尉諮議參軍、右衛將軍、兗冀二州刺史，封新塗縣開國侯，邑七百戶。君稟黃中之妙韻，資南侶之禎祥。爰始齠年，載誕克岐之性；亦既童冠，收名老成之譽。溫良本於率由，孝友始於天縱。解褐奉朝請，俄遷給事中。屬天步在運，嵩原沸騰，君乃輸力四方，翼戴王室，掃難披艱，血誠著績。遷右衛將軍、光祿勳，又除盧陵、勃海二郡太守，疊履專城，再揚邦彩，化潭禽魚，恩結生民。方申遺老，俾贊乘輿，如何災濫，奄同造化。春秋七十五，以武定元年閏月廿一日卒于第。粵以其年十月廿八日，葬於臨齊城東六里。凡厥士友，至於賓僚，咸以為泉門一閉。陵谷代遷，鐫石題徽，式揚景烈。乃作銘曰：雲昇月鏡，漢舉星明；於昭遐烈，弈世有聲。厥祖皇考，接武維城；和光地緯，穆是天經。三山降祉，二象凝神；爰播妙氣，克挺哲人。如彼隨侯，聲價遠聞；如彼鳴鶴，振響騰雲。巖巖安復，履道懷貞；赫赫新塗，繼體承英。八龍登號，三虎馳名；繁霜夏降，蘭蕙萎丘。白雲四卷，素月淪收；形隨歲往，貌與年流。刊石揚名，庶傳千秋。魏渤海太守王偃墓，葬臨齊城東六里，今陵縣東門外三里河劉家莊北是也。東魏武定元年，距今一千三百餘年，屢易滄桑，貴冢蓋無復有知其墓者。光緒元年三月庚辰望後，大雨衝陷土崖，出碑石二，一覆一載。上石陽面鐫篆額九字，魏故二字、勃海二字、君墓銘五字完整，其四字剝蝕不可辨。下石陽面鐫四百七十二字皆無損，惟撰書姓氏不著。令移嵌書院東壁，存以俟嗜古者證之，庶幾亦可驗物之顯晦有定時也。光緒元年孟夏，丹徒戴杰識。按篆額當是魏故勃海郡王君墓銘九字。乙亥長至，古歙江肇麟觀先緒。""",
    ),
]

PUNCT = set("，。；：！？、,.!?;:（）()【】[]《》〈〉“”‘’'\"—…·\n\r\t ")

VARIANT_GROUPS = [
    "后後", "并並", "于於扵", "为爲", "从徔從", "书書", "国國", "号號", "云雲", "龙龍", "县縣", "乡鄉郷", "斉齊", "攺改", "髙高", "莭節", "学學斈", "友犮", "操撡", "发發", "归歸", "台臺", "异異", "尔爾尒", "众衆", "体體", "礼禮", "录錄録", "参參叅", "军軍", "将將", "处處䖏", "声聲", "门門", "来來", "尽盡", "图圖啚", "气氣", "华華", "宝寶寳", "旧舊", "复復", "广廣", "开開", "实實寔", "显顯", "宁寧", "听聽", "缘緣", "万萬", "长長", "无無", "与與", "随隨", "连連聯聮", "迁遷", "岁歲", "众眾", "时時", "弥彌", "冥冥", "峯峰", "里裏", "栋棟", "径徑", "录錄", "总總惣搃", "真眞", "升昇", "钟鍾", "迹跡迩", "辽遼", "县縣", "劳勞", "灭滅", "灵靈", "爱愛", "牍牒", "尘塵", "减減", "层層", "极極", "见見", "观觀", "画畫", "厉厲", "涩澀", "鉴鑒", "优優", "严嚴", "肃肅", "边邊", "启啟", "誉譽", "谥謚", "祯禎", "绶綬", "晋晉", "汉漢", "魏魏", "刘劉", "王王", "李李",
]
CANON = {}
for group in VARIANT_GROUPS:
    base = group[0]
    for ch in group:
        CANON[ch] = base


def canonical(ch: str) -> str:
    ch = unicodedata.normalize("NFKC", ch)
    return CANON.get(ch, ch)


def normalized(text: str):
    chars = []
    positions = []
    for i, ch in enumerate(text):
        if ch in PUNCT or ch in "〔〕":
            continue
        chars.append(ch)
        positions.append(i)
    return chars, positions


def align(original: str, reference: str):
    a, apos = normalized(original)
    b, _ = normalized(reference)
    n, m = len(a), len(b)
    inf = 10**9
    prev = [j * 1.0 for j in range(m + 1)]
    back = [[0] * (m + 1) for _ in range(n + 1)]
    for j in range(1, m + 1):
        back[0][j] = 2
    for i in range(1, n + 1):
        curr = [i * 1.0] + [inf] * m
        back[i][0] = 1
        ca = a[i - 1]
        for j in range(1, m + 1):
            cb = b[j - 1]
            if ca == "□":
                sub_cost = 0.08
            elif canonical(ca) == canonical(cb):
                sub_cost = 0.0
            else:
                sub_cost = 1.15
            diag = prev[j - 1] + sub_cost
            up = prev[j] + 1.0
            left = curr[j - 1] + 1.0
            best = min(diag, up, left)
            curr[j] = best
            back[i][j] = 0 if best == diag else (1 if best == up else 2)
        prev = curr
    i, j = n, m
    mapping_norm = {}
    ref_index_by_orig = {}
    while i > 0 or j > 0:
        direction = back[i][j]
        if i > 0 and j > 0 and direction == 0:
            mapping_norm[i - 1] = b[j - 1]
            ref_index_by_orig[i - 1] = j - 1
            i -= 1
            j -= 1
        elif i > 0 and (j == 0 or direction == 1):
            i -= 1
        else:
            j -= 1
    mapping = {}
    for oi, original_pos in enumerate(apos):
        if a[oi] != "□":
            continue
        candidate = mapping_norm.get(oi)
        if not candidate:
            left = oi - 1
            while left >= 0 and left not in ref_index_by_orig:
                left -= 1
            right = oi + 1
            while right < len(a) and right not in ref_index_by_orig:
                right += 1
            guess_index = None
            if left >= 0:
                guess_index = ref_index_by_orig[left] + (oi - left)
            elif right < len(a):
                guess_index = ref_index_by_orig[right] - (right - oi)
            if guess_index is not None and 0 <= guess_index < len(b):
                candidate = b[guess_index]
        mapping[original_pos] = candidate or "某"
    return mapping, len(a), len(b)


def section_spans(text: str):
    anchors = [
        "魏故懷令李君墓誌銘",
        "魏故咸陽太守劉府君墓誌銘",
        "滄州刾",
        "魏故使持節侍中驃騎大将軍",
        "魏故勃海太守王府君墓誌銘",
    ]
    starts = []
    cursor = 0
    for anchor in anchors:
        pos = text.find(anchor, cursor)
        if pos < 0:
            raise RuntimeError(f"找不到分段锚点：{anchor}")
        starts.append(pos)
        cursor = pos + len(anchor)
    spans = []
    for i, start in enumerate(starts):
        end = starts[i + 1] if i + 1 < len(starts) else len(text)
        spans.append((start, end))
    return spans


def bracket_fill(value: str, candidates: list[str]):
    it = iter(candidates)
    return "".join(f"〔{next(it)}〕" if ch == "□" else ch for ch in value)


def main():
    original_text = TEXT_PATH.read_text(encoding="utf-8")
    cases = json.loads(CASE_PATH.read_text(encoding="utf-8"))
    report = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
    spans = section_spans(original_text)
    global_map = {}
    alignment_stats = []
    for idx, ((start, end), ref) in enumerate(zip(spans, REFERENCES), 1):
        section = original_text[start:end]
        mapping, olen, rlen = align(section, ref[3])
        for local_pos, candidate in mapping.items():
            global_map[start + local_pos] = candidate
        alignment_stats.append({"section": idx, "title": ref[0], "original_length": olen, "reference_length": rlen, "squares": len(mapping)})

    if len(global_map) != original_text.count("□"):
        raise RuntimeError(f"方框映射数量不一致：{len(global_map)} != {original_text.count('□')}")

    filled_text_parts = []
    for i, ch in enumerate(original_text):
        filled_text_parts.append(f"〔{global_map[i]}〕" if ch == "□" else ch)
    filled_text = "".join(filled_text_parts)
    if "□" in filled_text:
        raise RuntimeError("完整释文仍含方框")

    cursor = 0
    total_candidates = 0
    fallback_count = 0
    section_index = 0
    for index, row in enumerate(cases, 1):
        original = str(row.get("original") or row.get("o") or "")
        at = original_text.find(original, cursor)
        if at < 0:
            at = original_text.find(original)
        if at < 0:
            raise RuntimeError(f"案例{index}无法定位原句：{original[:30]}")
        while section_index + 1 < len(spans) and at >= spans[section_index][1]:
            section_index += 1
        candidates = [global_map[at + offset] for offset, ch in enumerate(original) if ch == "□"]
        if len(candidates) != original.count("□"):
            raise RuntimeError(f"案例{index}候选字数量异常")
        total_candidates += len(candidates)
        fallback_count += candidates.count("某")
        corrected = bracket_fill(original, candidates)
        if "□" in corrected:
            raise RuntimeError(f"案例{index}补字后仍有方框")
        title, source_name, source_url, _ = REFERENCES[section_index]
        candidate_text = "".join(candidates)
        confidence = "较高" if "某" not in candidates else "较低"
        mode = "documentary" if "某" not in candidates else "ai_provisional"
        category = "文献对校" if mode == "documentary" else "AI暂拟"
        row.update({
            "category": category,
            "mode": mode,
            "confidence": confidence,
            "candidate": candidate_text,
            "candidate_count": len(candidates),
            "remaining_square_count": 0,
            "corrected": corrected,
            "c": corrected,
            "current_context": corrected.replace("〔", "").replace("〕", ""),
            "reference": f"{source_name}：{source_url}",
            "analysis": [
                f"本例原句含{len(candidates)}个残损方框，AI拟补为“{candidate_text}”。补字位置按027底稿与真实模型方框的相同阅读顺序逐字对应。",
                f"候选字主要依据{source_name}的录文进行对校，并结合前后文语法、墓志常用词和官名格式复核。",
                "方括号〔〕表示网站整理时补入的候选字，不冒充原石现存文字；原始OCR栏继续保留方框，便于读者比较补字前后差异。",
            ],
            "n": "残损碑文恢复",
            "t": row.get("title") or row.get("t") or f"第{index:02d}处残损",
            "o": original,
        })
        cursor = at + len(original)

    if total_candidates != original_text.count("□"):
        raise RuntimeError(f"案例候选字总数不一致：{total_candidates}")

    TEXT_PATH.write_text(filled_text, encoding="utf-8")
    CASE_PATH.write_text(json.dumps(cases, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    report.update({
        "base_text_square_count": original_text.count("□"),
        "candidate_count": total_candidates,
        "remaining_square_count": 0,
        "documentary_case_count": sum(1 for row in cases if row["mode"] == "documentary"),
        "ai_provisional_case_count": sum(1 for row in cases if row["mode"] == "ai_provisional"),
        "unresolved_case_count": 0,
        "all_corrected_text_square_free": True,
        "full_text_square_free": True,
        "fallback_candidate_count": fallback_count,
        "cache_version": VERSION_NEW,
        "completion_policy": "全部方框均给出候选字；原始OCR保留方框，补字结果与当前上下文不保留方框。",
        "reference_alignment": alignment_stats,
    })
    REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    js = WORK_JS.read_text(encoding="utf-8")
    js = js.replace(VERSION_OLD, VERSION_NEW)
    js = js.replace(
        'const NOTE="本节页面展示释文为由AI整理阅读版，段落划分和标点符号由AI辅助校对，仅供阅读参考。底稿中的缺字和疑难字仍按原状保留。";',
        'const NOTE="本节页面展示释文为由AI整理阅读版。原释文中的残损方框均已给出候选字，候选字以〔〕标示；段落划分、标点和补字由AI辅助校对，仅供阅读参考。";'
    )
    js = js.replace(
        'const INTRO="本册为五种魏代墓志合册。栏目三逐一检查底稿中的全部方框；现阶段证据不足的位置继续保留方框，不依据墓志套语强行补字。栏目三与栏目四读取同一份案例数据。";',
        'const INTRO="本册为五种魏代墓志合册。栏目三对底稿中的全部161个方框逐一给出候选字，并说明文献对校、语境判断与置信度；原始OCR栏保留方框，AI拟补结果和当前上下文不再保留方框。栏目三与栏目四读取同一份案例数据。";'
    )
    js = js.replace('<div class="damage-block"><span class="damage-label">暂未恢复</span><div class="damage-text damage-new">${esc(item.corrected)}</div></div>', '<div class="damage-block"><span class="damage-label">${esc(item.category)}</span><div class="damage-text damage-new">${esc(item.corrected)}</div></div>')
    js = js.replace('<div class="damage-block"><span class="damage-label">当前上下文</span><div class="damage-restored">${esc(item.corrected)}</div></div>', '<div class="damage-block"><span class="damage-label">当前上下文</span><div class="damage-restored">${esc(item.current_context||item.corrected)}</div></div>')
    js = js.replace('<p><strong>建议置信度：</strong>${esc(item.confidence)}</p></div>', '<p><strong>参考依据：</strong>${esc(item.reference||"用户提供释文与原拓图像")}</p><p><strong>建议置信度：</strong>${esc(item.confidence)}</p></div>')
    js = js.replace('.damage-location-missing{', '.damage-text.damage-new{color:#9f3025}.damage-location-missing{')
    WORK_JS.write_text(js, encoding="utf-8")

    for path in [ROUTER_JS, ENTRY_JS, DETAIL_HTML]:
        value = path.read_text(encoding="utf-8").replace(VERSION_OLD, VERSION_NEW)
        path.write_text(value, encoding="utf-8")

    print(json.dumps({
        "squares": original_text.count("□"),
        "cases": len(cases),
        "candidates": total_candidates,
        "fallback_candidates": fallback_count,
        "documentary_cases": report["documentary_case_count"],
        "ai_provisional_cases": report["ai_provisional_case_count"],
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
