#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build 027《旧拓魏志五种》专属数据。

原则：
- 用户提供的释文是栏目二唯一底稿；只增加分段，不改方框外文字。
- 每个原始“□”均纳入栏目三统计；证据不足时统一保留为 unresolved。
- 案例坐标只使用仓库现有 026—030 模型分片中的真实方框。
- 仅更新 027 及接入 027 必需的共享路由。
"""
from __future__ import annotations

import json
import re
import shutil
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORK_ID = "027"
TITLE = "旧拓魏志五种"
FOLDER = "027_旧拓魏志五种"
VERSION = "20260724_wei_five_v1"
IMAGE_ROOT = f"assets/page_images/{FOLDER}/images"

SECTIONS = [
    ("魏故懷令李君墓誌銘", """魏故懷令李君墓誌銘。君諱超，字景昇，夲字景宗，後承始□□在江龙斉懸同，故避攺云。秦州隴西郡□道縣都郷華風里人也。雅眷髙莭，敦襲世風，言行足師，興作成准，循情斈犮，□心名義。安貧樂道，息詭遇之襟；介然峻特，標礭焉之撡。弱冠，舉司州秀才，拜奉朝請，除恒農郡冠軍府録事叅軍事，宰沁水縣。臣政崇治，綽居尤㝡。為受罪者所誙章，憲臺誤聽，被兹深□，除名為民。□是甘季中，浮沉閭巷，玉潔金志，卓尓無悶。到熙平二年，甫更徔䆠，補荊州前将軍騎兵叅軍事，復作懷令。已受拜，垂垂述軄，遭疾。正光五年八月十八⊙，卒于□陽縣之永年里宅，時季六十一。孤負華首，訖扵二邑，門徔無兩。逺迩酸恨懷之，百姓長慕喪氣，雖陳㽞之哀望胡季㲊，不是過也。越六年正月丙午□十六日辛酉，塟洛陽縣䨱舟山之東南。玄壞難窮，陵谷時異，刻兹隂石，照序光塵。

泱泱顯□□□，西垂代襲。清則□炳，羽儀道妙之門；緒風属斯，惟祖惟□□。儻環竒昌，謨迭駕；髙矱眀䂓，杳量无隄。玄契不貲，棇循異貫，貟應紛枝。灼灼伊君，山立淵渟；棲真宅正，□縄履程。懿鑠為筫，醇素用情；均冶禮世，氣重財輕。□既徔招，旁溢鴻聲；随牒出入，密勿力誠。爰莅近邑，先邁儀形；絶交獨坐，化動隂窴。尚徳貽谷，衆實叵盖；柫衽歸来，餝轅□帶。恂恂郷閈，万殊一會；優柔善成，无小无大。垂白再仕，汎尓㳂流；階倫稍降，盛業愈遒。逯作後城，士女承□□；頓方馳盡，圡悲愁。尅莭□言，引賞靡徴；端恭妄□，家俗虚膺。㰌彼圮䟢，事□篇繒；長源未輸，深啚乍卷。蕰此逸機，空生徒返；茲寃易削，疇毒難遣。楨掬踈竦，泉房寒逺；孀孤内爤，妹弟摧咺。弍鏤沉石，託注幽篆。妻恒農楊氏，父談，為郏州主薄。息女孟冝，年丗六，適恒農王始㑺，郡中正。息女媛姿，適遼西常□，侍御史。息女仲妃，適武威賈子□，涼州治中。息道沖。息女婉華。息女烋顔。息女四輝。息道逸，年十六。息道栖，年十三。"""),
    ("魏故咸陽太守劉府君墓誌銘", """魏故咸陽太守劉府君墓誌銘。君諱玉，字天寳，□農胡城人也。□初基胄，与日月同開。舜封次茅，通君臣之始；周秦大漢，並斑名位。逺祖司□□之苗，其中易世，□一足明。值漢中譏凶奴之患，李陵出計，軍□不利，遂沒霧廷。先人祖宗，便習其俗，㛰姻官帶，与之錯雜。大魏開建，託㝎恒代。以曾祖初，万頭大族之胄，冝□名□；徔駕之衆，理須替率，依地罝官，為何軍地汗。尒時此斑例，□州枚義成王南計□安。以祖可洛侯，名家之孫，召接為副，充子都将，与王筞謀，愇内剬㝎雍境，遂以圡荒，即今鎭押。君數世重䕃，成應引内，為西佂子都，出祺之梃，屢有薫迩，冝可昇接，錫之矛圡□咸陽太守。春秋七十八，以孝昌三年嵗次丙午十一月廿四日，平於家。□□□基，雲景神䌽重暎。是日劉□世立，堅明□綖，台司志含中貞，翼輔王室，唯安唯寧。□踵相继，其器易新；召莅予圡，四裳来寘。□接㤙化，冨壞殷民，體含王□，不磨自□。"""),
    ("滄州刺史王僧墓誌銘", """滄州刾□王僧墓誌銘。维大魏天平三年，嵗次丙辰二月壬申□十三日甲申，故䮾驤將軍、諌議大夫、贈假莭、□滄州諸軍事、佂虜將軍、滄州刾史王僧墓誌。君姓王，諱僧，字子慎，滄州浮陽饒安人也。其先蔚炳，弗復重詳。顯袒□有功漢室，蔀苻東夏，仍□家焉。曽袒□，以大魏太常年中，除建威將軍、北平太守。祖□，少腹庠門，以清貞自䖏，洪鍳雅粋，不以世事逕懷，故刾史張儒辟為茂才，鼎然不拜。父願，以真君年中，黃輿南討，□功天府，除平逺將軍、歩兵校尉，在政未幾，功名顯署，不幸如平，贈東平郡君。㓋源淵□，眇若嵩峯；禀算瓊根，□如滄海。故童年志學，聲播稚□；逰心八素，必以禮義為仼，汪汪焉弗可量也。以正始年中，除盪□將軍、殿中將軍。後以清顯之仼，寔歸才今；庴笇之功，良湏懿望。神龜年中，兾圡不賔，民懷粄扈，命將出師，掃除□□。以君才優噐秀，名為都□，辞不獲命，□乃擁麾東指，羣兇奔□，垺皼始交，賊徒冰潰。正光中，除清州髙陽今，未及下車而芳風亟聞，不俟㫷月而民知且格。難鲁恭之在中牟、宻子之治善甫，無已過也。俄遷白水太守，招慰酋渠，今塞外無塵；撫孤矜□，廓清漢右。後除䮾驤將軍、諌議大夫，冝保□年，亨兹遐授。豈啚不弔，奄摧良木。春秋五十八，天平二年三月十日，薨扵平陽，窆扵饒安。贈假莭、□滄州諸軍事、佂虜將軍、滄州刾史。扵是閭里戀景行之潛徽，悲□蹤而思結，乃作銘日：

□緒蟬聨，逺□綿萇；□葉載德，踵世傳芳。惟君绮日，蕰寳懷璋；年始强仕，朗秀垂芳。而佊蘭桂，載馥載香；比之秋月，影囑唅光；拔之冬日，暉景□長。春風始□，奄摧嚴霜；逥翔鳳罕，飜飛下國。視民軓義，咸斑禮則；雲柯渃彩，頌聲由勒。景行孤存，魂子潜默；彫蘭折玉，摧賢墜德。翠木霜枝，哲人維尅；類楊□殖，松栝始生。幽銄永□，闇室未更；黄泉多晦，蒿里不明；暁夜未□，路断人行。"""),
    ("魏故使持節侍中驃騎大將軍劉君墓誌銘", """魏故使持節侍中驃騎大将軍太保太尉公録尚書事都□兾定瀛殷并□汾晉建郏肆十一州諸軍事兾州刾□郏肆二州大中正苐一酋長敷城縣開國公劉君墓誌銘。君諱懿，字貴珎，弘農華隂人也。自豢龍啓胄，赤鳥降祥，磐石相連，犬牙交錯，長原逺葉，繁衍不窮，斧衣朱紱，蟬聮弈世。祖給事，德潤扵身，民譽斯在。父肆州，行成扵已，名髙當丗。君體局强正，氣榦雄立，剛柔並運，方圎備舉。棄置書劔，宿□英豪之志；指畫山澤，早懷将率□□。起家□大将軍府騎兵□軍、苐一酋長。㽵帝之初，以勲□義舉，封敷城縣開國伯，□□区□戸；除直閤将軍、左中郎将、左将軍、太中大夫。帝啚時意，以爲未盡，進爵爲公，□□区百，拜散騎常侍、撫軍将軍。乃除使持節都□涼州諸軍事、本将軍、涼州□□□、鎮西将軍、常侍、開國如故。又爲征南将軍、□紫光禄大夫、兼尚書右僕射、西南□行臺。復除使持節都□二汾晉三州諸軍事、驃騎将軍、晉州刾史，又行汾州事。大丞相勃海王，命丗挺生，應期覇世。君既同德比義，事等魚水，乃除使持節都□肆州諸軍事、本将軍、肆州刾史，又加驃騎大将軍、儀同三司，餘如故。及聖眀啓運，定鼎鄴宫，乃睠西頋，權烽未息，遂以君爲使持節都□郏州諸軍事、本将軍、郏州刾史，儀同、開國如故。又以本袟爲御史中尉，復兼尚書僕射、西南道行臺，加開府，餘如故。式遏姧□，鎮靜河洛，復路還朝，仍居本位。

君自解巾入仕，撫劔徔戎，威略□聞，强毅著稱。其猶髙松□棟梁之質，類如金石，懷堅剛之性。既時逢多難，丗属慇憂，羣飛竸起，横流未歇。折衡行陣之間，運籌帷幄之内，雄啚㽵志，與韓白連衡；将略兵權，共孫吴合契。猛烈同於夏曰，嚴□䓁於秋霜；去草逐雀，懷鶬鷹之氣；誅□制□，起卧□之威。降年不永，奄徔晨露。以興和元年十一月辛亥□十七日丁卯，薨扵鄴都。追贈使持節、侍中、太保、太尉公、録尚書事、都□兾定瀛殷并区州諸軍事、兾州刾史，餘官如故。粤以二年，嵗在庚申，正月庚成□卄四曰癸酉，葬於肆盧郷孝義里。乃伦銘曰：

淼淼長蘭，巖巖峻趾；就曰成德，聚星効祉。家風未沫，丗禄不巳。扵穆夫君，一日千里；昂昂風氣，烈烈霜威。進退□度，信義無違；行髙州里，聲滿邦畿。抗足髙騖，理隔舊飛；秉麾執鐸，南臨北撫。肅清邦國，折衝壃寓；駿足未窮，逸翮方舉。奄異金石，遽同草莽；眷言歸奔，□嗟臨穴。荆棘方生，松檟将列；千秋万古，光沉影绝。陵谷若虧，聲芳□晣。夫人常山王之孫，尚書左僕射元生之女。長子撫軍将軍、銀青光禄大夫、都□肆州諸軍事、肆州刾史元孫，妻驃騎大将軍司徒公元恭之女。丗子散騎常侍、千牛備身洪徽，妻大丞相勃海髙王之第三女。次子肆州主薄徽彦，少子徽祖。巍□□□□□□墓□。"""),
    ("魏故勃海太守王府君墓誌銘", """魏故勃海太守王府君墓誌銘。君諱偃，字槃□，太原晉陽人也。其先盖隆周之遐□。當春秋時，王子城父自周適□，有敗犾之□，遂錫王氏焉。丹車紫㦈之貴，雄俠□□；調風渫鼎之豪，聲華三輔。祖芬，安復侯、駙馬都尉、相國府□軍、給事中、太子虎賁中郎将，遷江夏王司馬、帶肝胎太守。父□龍，起家鎮北府□軍、建威將軍、臨淮太守、太尉諮議□軍、右衛將軍、兖兾二州刾史，封新塗縣開國侯，邑七百戸。君稟黄中之妙韻，資南□之禎祥。爰始齠秊，載誕剋岐之性；亦既童□，収名先成之譽。温良本於率由，孝友始於天縱。解褐奉朝請，俄遷給事中。属天歩在運，嵩原沸騰，君乃輸力四方，翼戴王室，掃難披艱，血誠著績。遷右衛將軍、光禄□。又除盧陵、勃海二□太守，疊履專城，□揚邦彩，化潭禽□，㤙結生民。方申遺先，俾賛乗轝，如何灾濫，奄同造化。春秋七十□□，武定亢秊閏月廿一日，□亐第。粤□其秊十月廿八日，葬於臨齊城東六里。凡□士友，至於賔僚，咸□爲□門一□。陵谷代遷，鐫石題徽，式揚景烈。□□銘□：

雲昇月鏡，漢舉星明；於照遐烈，□世有聲。□祖皇考，接武維城；和光地緯，穆是天經。三山降祉，二爲凝神；爰播妙氣，剋挺哲人。如彼瓍□，聲價逺聞；如彼鳴鸖，振響騰雲。巖巖安復，□遒懷貞；赫赫新塗，継體承英。八龍登号，三虎馳名；繁霜夏降，蘭蕙萎丘。白雲四卷，□月淪収；形随嵗注，狠與秊流。刊石揚名，庻傳千秋。"""),
    ("王偃墓志清光绪元年出土后跋", """魏渤海太守王偃墓，葬臨齊城東六里。今陵縣東門外三里河劉家莊北是也。東魏武定元年，距今一千三百餘年，屢易滄桑，□□蓋無復有知其墓者。三月庚辰□後，大雨衝陷土崖，出碑石二，一覆一載。上石陽靣鎸篆額九字，魏□二字、海□二字、君墓銘五字完整，其四字剝蝕不可辨。下石陽靣鎸四百七十二字皆無損，惟撰書姓氏不著。令移嵌書院東壁，存以俟嗜古者證之。□□□亦可騐物之顯晦有定時也。光緒元年孟夏，丹徒戴杰識。按篆額當是魏故勃海郡王君墓銘九字。乙亥長至，古歙江肇□□□□。"""),
]

FULL_TEXT = "\n\n".join(text.strip() for _title, text in SECTIONS).strip() + "\n"
PUNCT = set(" \t\r\n，。；：！？、,.!?;:（）()【】[]《》〈〉“”‘’『』「」—－…·⊙")
CANON_MAP = str.maketrans({
    "扵":"于","於":"于","徔":"从","来":"来","來":"来","髙":"高","眀":"明","夲":"本",
    "刾":"刺","佂":"征","莭":"节","叅":"参","塟":"葬","圡":"土","尓":"尔","兾":"冀",
    "尅":"克","丗":"世","録":"录","將":"将","軍":"军","諱":"讳","誌":"志","銘":"铭",
    "縣":"县","郷":"乡","陽":"阳","陰":"阴","隂":"阴","書":"书","門":"门","國":"国",
    "爲":"为","為":"为","與":"与","無":"无","萬":"万","衆":"众","徳":"德","聲":"声",
    "遠":"远","逺":"远","後":"后","體":"体","華":"华","開":"开","継":"继","傳":"传",
})


def dump(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def chinese_number(n: int) -> str:
    digits = "零一二三四五六七八九"
    if n < 10: return digits[n]
    if n == 10: return "十"
    if n < 20: return "十" + digits[n % 10]
    if n < 100: return digits[n // 10] + "十" + (digits[n % 10] if n % 10 else "")
    return str(n)


def normalize_seq(text: str) -> str:
    return "".join(ch.translate(CANON_MAP) for ch in str(text) if ch not in PUNCT)


def row_char(row: dict) -> str:
    return str(row.get("char") or row.get("text") or row.get("recognized_char") or row.get("label") or "")[:1]


def number(row: dict, *keys, default=0.0) -> float:
    for key in keys:
        value = row.get(key)
        if value is None: continue
        try: return float(value)
        except (TypeError, ValueError): pass
    return float(default)


def extract_records(data):
    if isinstance(data, list): return data
    if isinstance(data, dict):
        for key in ("records","rows","items","data","glyphs"):
            if isinstance(data.get(key), list): return data[key]
        lists = [v for v in data.values() if isinstance(v, list)]
        if lists: return max(lists, key=len)
    raise RuntimeError("无法识别模型坐标分片结构")


def normalize_model_rows(raw_rows, page_index):
    groups = defaultdict(list)
    page_meta = {int(p.get("page") or p.get("canvas_index") or i+1): p for i,p in enumerate(page_index)}
    for raw in raw_rows:
        if not isinstance(raw, dict) or str(raw.get("work_id") or "").zfill(3) != WORK_ID: continue
        page = int(number(raw,"canvas_index","page","page_no","page_number",default=0))
        if page <= 0: continue
        bbox = raw.get("bbox") if isinstance(raw.get("bbox"),(list,tuple)) else []
        x = number(raw,"x","bbox_x",default=bbox[0] if len(bbox)>0 else 0)
        y = number(raw,"y","bbox_y",default=bbox[1] if len(bbox)>1 else 0)
        w = number(raw,"w","bbox_w",default=bbox[2] if len(bbox)>2 else 0)
        h = number(raw,"h","bbox_h",default=bbox[3] if len(bbox)>3 else 0)
        if w <= 0 or h <= 0: continue
        meta = page_meta.get(page,{})
        order = int(number(raw,"order_in_page","annotation_index","order",default=len(groups[page])+1))
        char = row_char(raw)
        row = dict(raw)
        row.update({
            "glyph_id": str(raw.get("glyph_id") or f"{FOLDER}_p{page:04d}_c{order:03d}"),
            "char": char, "text": char, "work_id": WORK_ID, "work_title": TITLE,
            "canvas_index": page, "canvas_label": meta.get("label") or meta.get("canvas_label") or chinese_number(page),
            "order_in_page": order, "annotation_index": order,
            "x": x, "y": y, "w": w, "h": h,
            "bbox_x": x, "bbox_y": y, "bbox_w": w, "bbox_h": h,
            "bbox": [x,y,w,h], "bbox_xywh": [x,y,w,h],
            "bbox_source": str(raw.get("bbox_source") or raw.get("source") or "model_border_refined"),
            "source": str(raw.get("source") or raw.get("bbox_source") or "model_border_refined"),
            "local_image": meta.get("image") or f"{IMAGE_ROOT}/{page:04d}_{chinese_number(page)}.jpg",
        })
        groups[page].append(row)
    for page, rows in groups.items():
        rows.sort(key=lambda r:(int(r.get("order_in_page",0)),float(r.get("x",0)),float(r.get("y",0))))
        for i,row in enumerate(rows,1):
            row["order_in_page"] = i; row["annotation_index"] = i
    return groups


def split_units(text: str):
    normalized = text.replace("\r\n","\n").replace("\r","\n")
    chunks = re.split(r"(?<=[。！？；])", normalized)
    return [chunk.strip() for chunk in chunks if chunk.strip()]


def context_kind(unit: str, section_title: str) -> str:
    if "光緒" in unit or "書院" in unit or "篆額" in unit or "大雨" in unit:
        return "出土、移藏与后跋文字"
    if any(word in unit for word in ("歲次","嵗次","年","月","日","春秋","葬","塟","薨","卒","窆")):
        return "纪年、卒葬与干支信息"
    if any(word in unit for word in ("妻","息女","長子","次子","少子","夫人")):
        return "亲属、婚配与子女信息"
    if any(word in unit for word in ("君諱","字","人也","祖","父","曾祖","曽袒","顯袒")):
        return "姓名、籍贯与世系信息"
    if any(word in unit for word in ("將軍","将軍","太守","刺史","刾史","都□","使持節","開國","官","府","州諸軍事")):
        return "官衔、封爵与任职序列"
    if "墓誌銘" in unit or "墓誌" in unit:
        return "题名与志主身份"
    if section_title.endswith("墓誌銘") and any(word in unit for word in ("銘曰","銘日","乃伦銘","乃作銘")):
        return "铭辞起首与篇章衔接"
    return "叙事或铭辞残损"


def case_analysis(section_title: str, unit: str, square_count: int):
    kind = context_kind(unit, section_title)
    first = unit.find("□")
    left = unit[max(0,first-8):first]
    right = unit[first+1:first+9]
    if kind == "官衔、封爵与任职序列":
        reason = "缺字处可能涉及官名层级、都督辖区或封爵数额；仅凭常见官衔套语仍存在多个组合，不能强行定字。"
    elif kind == "姓名、籍贯与世系信息":
        reason = "该处直接关系人名、字、籍贯或祖先名号；缺少同墓志可靠录文和可辨笔画时，补字会改变人物身份信息。"
    elif kind == "纪年、卒葬与干支信息":
        reason = "纪年和干支需要同时满足年号、月份、朔日与日序关系；现有底稿不足以完成唯一校验。"
    elif kind == "亲属、婚配与子女信息":
        reason = "亲属姓名和婚配对象属于专名，不能仅按上下文或常见姓氏猜补。"
    elif kind == "出土、移藏与后跋文字":
        reason = "后跋涉及出土经过、篆额释读和题记者署名，必须结合后跋原拓逐字核对。"
    elif kind == "题名与志主身份":
        reason = "题名或志主身份中的官称具有固定格式，但当前方框数量与可容纳词组仍不能形成唯一对应。"
    else:
        reason = "虽可依据对偶和语法推测若干词语，但残损位置仍可容纳多种表达，证据不足以逐字确认。"
    return [
        f"本例位于《{section_title}》的{kind}，第一个方框处于“{left}”与“{right}”之间，本语义单元共覆盖{square_count}个方框。",
        reason,
    ]


def build_cases():
    cases=[]
    full_cursor=0
    for section_title, section_text in SECTIONS:
        section_start = FULL_TEXT.find(section_text.strip(), full_cursor)
        if section_start < 0: raise RuntimeError(f"无法定位章节：{section_title}")
        local_cursor=0
        for unit in split_units(section_text):
            if "□" not in unit: continue
            local_at = section_text.find(unit, local_cursor)
            if local_at < 0: local_at = section_text.find(unit)
            global_at = section_start + local_at
            first_square = global_at + unit.find("□")
            square_count = unit.count("□")
            kind = context_kind(unit, section_title)
            idx=len(cases)+1
            cases.append({
                "id": f"{idx:02d}",
                "category": "暂未恢复",
                "title": f"{section_title}·{kind}",
                "original": unit,
                "corrected": unit,
                "candidate": "",
                "mode": "unresolved",
                "confidence": "暂无法判断",
                "analysis": case_analysis(section_title,unit,square_count),
                "reference": "用户提供释文与仓库原拓图像",
                "square_count": square_count,
                "candidate_count": 0,
                "remaining_square_count": square_count,
                "highlight_patterns": [unit],
                "locate_anchor": unit,
                "first_square_text_index": first_square,
                "n": "残损碑文恢复", "t": f"{section_title}·{kind}", "o": unit, "c": unit,
            })
            local_cursor = max(local_cursor, local_at + len(unit))
        full_cursor = section_start + len(section_text)
    return cases


def semiglobal_map(user_seq: str, model_seq: str):
    n,m=len(user_seq),len(model_seq); gap=-2
    prev=[0]*(m+1); trace=[bytearray(m+1) for _ in range(n+1)]
    for i in range(1,n+1):
        curr=[0]*(m+1); curr[0]=i*gap; trace[i][0]=1; u=user_seq[i-1]
        for j in range(1,m+1):
            v=model_seq[j-1]
            score=7 if u==v=="□" else (6 if u==v else (1 if u=="□" else (0 if v=="□" else -3)))
            diag=prev[j-1]+score; up=prev[j]+gap; left=curr[j-1]+gap; best=max(diag,up,left)
            curr[j]=best; trace[i][j]=0 if best==diag else (1 if best==up else 2)
        prev=curr
    j=max(range(m+1),key=lambda k:prev[k]); i=n; mapping={}
    while i>0 and j>=0:
        move=trace[i][j]
        if move==0 and j>0: mapping[i-1]=j-1; i-=1; j-=1
        elif move==1 or j==0: i-=1
        else: j-=1
    return mapping


def locate_cases(cases, flat_rows):
    user_seq=normalize_seq(FULL_TEXT); model_seq="".join(normalize_seq(row_char(row)) for row in flat_rows)
    user_squares=[i for i,ch in enumerate(user_seq) if ch=="□"]
    model_squares=[i for i,ch in enumerate(model_seq) if ch=="□"]
    mapping_method="semiglobal-alignment"; square_targets={}
    # 将原始文本索引换算成规范化序列索引。
    raw_to_norm={}; norm_i=0
    for raw_i,ch in enumerate(FULL_TEXT):
        if ch in PUNCT: continue
        raw_to_norm[raw_i]=norm_i; norm_i+=1
    if len(user_squares)==len(model_squares):
        mapping_method="exact-square-order"
        for ordinal,upos in enumerate(user_squares): square_targets[upos]=model_squares[ordinal]
    else:
        aligned=semiglobal_map(user_seq,model_seq)
        for upos in user_squares:
            midx=aligned.get(upos)
            if midx is None: continue
            if model_seq[midx]!="□":
                nearby=[p for p in model_squares if abs(p-midx)<=4]
                if nearby: midx=min(nearby,key=lambda p:abs(p-midx))
            square_targets[upos]=midx
    located=0
    for case in cases:
        raw_index=int(case.pop("first_square_text_index"))
        upos=raw_to_norm.get(raw_index)
        midx=square_targets.get(upos) if upos is not None else None
        location=None
        if midx is not None and 0<=midx<len(flat_rows):
            row=flat_rows[midx]
            if row_char(row)=="□":
                location={
                    "page":int(row["canvas_index"]),"glyph_id":row["glyph_id"],
                    "canvas":{"w":int(number(row,"canvas_width",default=1474)),"h":int(number(row,"canvas_height",default=2226))},
                    "bbox":{"x":row["x"],"y":row["y"],"w":row["w"],"h":row["h"]},
                    "image":row.get("local_image") or f"{IMAGE_ROOT}/{int(row['canvas_index']):04d}_{chinese_number(int(row['canvas_index']))}.jpg",
                    "bbox_source":row.get("bbox_source","model_border_refined"),"match_method":mapping_method,
                }
        case["locations"]=[location] if location else []
        case["page"]=location["page"] if location else "—"
        case["match_method"]=mapping_method
        if location: located+=1
    return {
        "user_sequence_length":len(user_seq),"model_sequence_length":len(model_seq),
        "user_square_count":len(user_squares),"model_square_count":len(model_squares),
        "mapping_method":mapping_method,"located_cases":located,
    }


def update_catalog(case_count: int):
    path=ROOT/"data/beitie_catalog.json"; data=json.loads(path.read_text(encoding="utf-8"))
    item=next(x for x in data if str(x.get("id"))==WORK_ID)
    item.update({
        "title":TITLE,"dynasty":"北魏正光六年至东魏武定元年（525—543）","script":"楷书",
        "creator":"五种魏代墓志合册，撰书者多未详","status":"完整样板",
        "subtitle":f"完整释文、71页逐页真实坐标与{case_count}例残损待考案例已接入。",
        "year":"525–543",
    })
    dump(path,data)


def update_header():
    path=ROOT/"data/beitie_header_info.json"; data=json.loads(path.read_text(encoding="utf-8"))
    data[WORK_ID]={
        "source_file":"旧拓魏志五种.txt","title":TITLE,
        "basic":{
            "首题":"旧拓魏志五种","其他题名":"魏志五种；五种魏代墓志拓本合册",
            "责任者":"五种魏代墓志合册，撰书者多未详","书体":"楷书","版本":"旧拓本合册",
            "数量":"五种墓志拓本合册；数字化图像共71页",
            "刻立年代":"北魏正光六年至东魏武定元年（525—543）",
            "馆藏":"上海图书馆",
            "来源":"《翰墨瑰宝：上海图书馆藏珍本碑帖丛刊》第四辑，上海图书馆，上海古籍出版社，2017年",
            "版本说明":"该题名为五种魏代墓志拓本的合册名称，并非单一碑刻名称。册内五件墓志的志主、时代、原葬地与出土线索并不统一，因此本页按合册方式展示，不设置统一地点地图。",
            "镌刻特征":"本册收录《魏故怀令李君墓志铭》《魏故咸阳太守刘府君墓志铭》《沧州刺史王僧墓志铭》《魏故使持节侍中骠骑大将军刘君墓志铭》《魏故勃海太守王府君墓志铭》五种，并附王偃墓志清光绪元年出土后跋。内容兼具北朝墓志书法与家世、官职、卒葬、婚配等史料价值。",
            "铭文行款":"合收五种魏代墓志及《王偃墓志》清光绪元年出土后跋",
        },
    }
    dump(path,data)


def update_page_index(groups):
    path=ROOT/"data/page_images_index.json"; data=json.loads(path.read_text(encoding="utf-8")); work=data["works"][WORK_ID]
    work["title"]=TITLE
    for i,page in enumerate(work.get("pages",[]),1):
        page_no=int(page.get("page") or page.get("canvas_index") or i); rows=groups.get(page_no,[]); chars=[row_char(r) for r in rows]
        page["text_clean"]="".join(chars); page["text_raw"]="\n".join(chars); page["char_count"]=len(chars); page["has_char_boxes"]=bool(chars)
    dump(path,data)


def write_coordinates(groups,page_count):
    root=ROOT/"data/glyph_boxes/iiif/027"
    if root.exists(): shutil.rmtree(root)
    root.mkdir(parents=True,exist_ok=True)
    for page in range(1,page_count+1): dump(root/f"page_{page:04d}.json",groups.get(page,[]))


def write_coordinate_adapter():
    src=(ROOT/"js/work-026-coordinate-adapter.js").read_text(encoding="utf-8")
    src=src.replace("026《麻姑山仙坛记》","027《旧拓魏志五种》").replace('workId!=="026"','workId!=="027"')
    src=src.replace("__WORK_026_COORDINATE_ADAPTER__","__WORK_027_COORDINATE_ADAPTER__")
    src=src.replace('const CACHE_TAG="20260724_magushan_v1"','const CACHE_TAG="20260724_wei_five_v1"')
    src=src.replace('const ROOT="data/glyph_boxes/iiif/026"','const ROOT="data/glyph_boxes/iiif/027"')
    src=src.replace('work_id:"026"','work_id:"027"').replace('`026_${pageNo}_${index+1}`','`027_${pageNo}_${index+1}`')
    src=src.replace("WORK_026_COORDINATES","WORK_027_COORDINATES").replace("work-026-coordinate-adapter-ready","work-027-coordinate-adapter-ready")
    src=src.replace("[work-026-coordinate-adapter]","[work-027-coordinate-adapter]")
    (ROOT/"js/work-027-coordinate-adapter.js").write_text(src,encoding="utf-8")


def write_work_script():
    script=r'''/* 027《旧拓魏志五种》栏目二、三、四专属模块。 */
(function(){
  "use strict";
  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(workId!=="027"||window.__WORK_027_WEI_FIVE__)return;
  window.__WORK_027_WEI_FIVE__=true;
  window.__DAMAGE_CASE_UNBRACKETED_ADAPTER__=true;
  window.__DAMAGE_CASE_INTEGRITY_V2__=true;
  window.__DAMAGE_CASE_PARTIAL_STATUS__=true;
  window.__DAMAGE_CASE_AUDIT_V2__=true;
  window.__DAMAGE_CASE_STANDARD_PATCH_V4__=true;
  document.documentElement.classList.add("work027-no-location-map");

  const TITLE="旧拓魏志五种";
  const VERSION="20260724_wei_five_v1";
  const TEXT_URL=`data/work027_full_text.txt?v=${VERSION}`;
  const CASE_URL=`data/work027_damage_cases.json?v=${VERSION}`;
  const IMAGE_ROOT="assets/page_images/027_旧拓魏志五种/images";
  const NOTE="本节页面展示释文为由AI整理阅读版，段落划分和标点符号由AI辅助校对，仅供阅读参考。底稿中的缺字和疑难字仍按原状保留。";
  const INTRO="本册为五种魏代墓志合册。栏目三逐一检查底稿中的全部方框；现阶段证据不足的位置继续保留方框，不依据墓志套语强行补字。栏目三与栏目四读取同一份案例数据。";
  const esc=v=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const clone=v=>JSON.parse(JSON.stringify(v));
  const digits=["零","一","二","三","四","五","六","七","八","九"];
  function cn(n){if(n<10)return digits[n];if(n===10)return"十";if(n<20)return`十${digits[n%10]}`;if(n<100)return`${digits[Math.floor(n/10)]}十${n%10?digits[n%10]:""}`;return String(n);}
  function directImage(page){const n=Number(page||0);return n?`${IMAGE_ROOT}/${String(n).padStart(4,"0")}_${cn(n)}.jpg`:"";}
  async function fetchText(url){const r=await fetch(url,{cache:"no-store"});if(!r.ok)throw new Error(`${url} ${r.status}`);return r.text();}
  async function fetchJSON(url){const r=await fetch(url,{cache:"no-store"});if(!r.ok)throw new Error(`${url} ${r.status}`);return r.json();}
  function setMenuTitle(index,title){const link=document.querySelector(`.side a:nth-of-type(${index})`);if(link)link.textContent=title;}
  function removeLocationMap(){
    const headings=Array.from(document.querySelectorAll("h1,h2,h3,h4,strong,.card-title,.map-title"));
    headings.filter(node=>(node.textContent||"").trim()==="地点地图").forEach(node=>{
      const card=node.closest("aside,section,.location-card,.map-card,.place-card,.detail-map-card")||node.parentElement;
      if(card&&!card.classList.contains("side")&&card.id!=="places")card.remove();
    });
  }
  function paragraphHTML(text){
    const parts=String(text||"").replaceAll("\r\n","\n").replaceAll("\r","\n").split("\n\n").map(p=>p.trim()).filter(Boolean);
    return parts.map(part=>{
      const isTitle=/^(魏故|滄州|魏渤海太守王偃墓)/.test(part)&&part.indexOf("。")==part.lastIndexOf("。");
      return isTitle?`<h4 class="work027-part-title">${esc(part)}</h4>`:`<p>${esc(part)}</p>`;
    }).join("");
  }
  function normalizeCase(row,index){
    const id=String(row?.id||index+1).padStart(2,"0"),title=String(row?.title||row?.t||`第${id}处残损`),original=String(row?.original||row?.o||""),corrected=String(row?.corrected||row?.c||original),locations=Array.isArray(row?.locations)?row.locations:[];
    return {...row,id,title,original,corrected,category:String(row?.category||"暂未恢复"),n:"残损碑文恢复",t:title,o:original,c:corrected,confidence:String(row?.confidence||"暂无法判断"),analysis:Array.isArray(row?.analysis)?row.analysis.map(String):[],locations,page:row?.page||locations[0]?.page||"—"};
  }
  function publishCases(items){window.DAMAGE_AI_CASES=items.map(item=>({...clone(item),n:"残损碑文恢复",t:item.title,o:item.original,c:item.corrected,crowdsourceCategory:item.category}));window.dispatchEvent(new CustomEvent("work-027-cases-ready",{detail:{count:items.length}}));}
  function boldProblems(root,items){
    const patterns=items.flatMap(item=>item.highlight_patterns?.length?item.highlight_patterns:[item.original]).filter(Boolean).sort((a,b)=>b.length-a.length);
    root.querySelectorAll("p").forEach(p=>{const value=p.textContent||"";const ranges=[];patterns.forEach(pattern=>{const at=value.indexOf(pattern);if(at>=0)ranges.push({start:at,end:at+pattern.length});});if(!ranges.length)return;ranges.sort((a,b)=>a.start-b.start||b.end-a.end);const f=document.createDocumentFragment();let offset=0;ranges.forEach(r=>{if(r.start<offset)return;if(r.start>offset)f.appendChild(document.createTextNode(value.slice(offset,r.start)));const s=document.createElement("strong");s.className="transcript-problem-sentence";s.textContent=value.slice(r.start,r.end);f.appendChild(s);offset=r.end;});if(offset<value.length)f.appendChild(document.createTextNode(value.slice(offset)));p.replaceChildren(f);});
  }
  function renderTranscript(text,items){const section=document.getElementById("calligraphy");if(!section)return;setMenuTitle(2,"二、碑文释文");section.className="content-card full-transcript-section";section.innerHTML=`<h2 class="section-title">二、碑文释文</h2><p class="full-transcript-note">${NOTE}</p><div class="full-transcript-card"><header class="full-transcript-header"><h3>${TITLE}</h3><span class="full-transcript-ornament"></span></header><div class="full-transcript-body">${paragraphHTML(text)}</div></div>`;boldProblems(section,items);}
  function makeLocation(item){const source=item.locations?.[0],bbox=source?.bbox,page=Number(source?.page||item.page||0);if(!bbox||!page)return null;const canvas={w:Number(source.canvas?.w||1474),h:Number(source.canvas?.h||2226)},target={x:Number(bbox.x??bbox[0]??0),y:Number(bbox.y??bbox[1]??0),w:Number(bbox.w??bbox[2]??0),h:Number(bbox.h??bbox[3]??0)};if(target.w<=0||target.h<=0)return null;const cropW=Math.min(canvas.w,Math.max(900,target.w+620)),cropH=Math.min(canvas.h,Math.max(1250,target.h+940));return{page,image:String(source.image||directImage(page)),canvas,target,crop:{x:Math.max(0,Math.min(canvas.w-cropW,target.x+target.w/2-cropW/2)),y:Math.max(0,Math.min(canvas.h-cropH,target.y+target.h/2-cropH/2)),w:cropW,h:cropH}};}
  function imageHTML(item){const l=makeLocation(item);if(!l?.image)return'<div class="damage-location-missing"><p>现有逐字坐标中暂未可靠定位本句第一个问题字，系统不会使用相邻完整字代替。</p></div>';return`<div class="damage-viewport" data-image="${esc(l.image)}" title="双击查看原始拓片"><svg class="damage-crop-svg" viewBox="${l.crop.x} ${l.crop.y} ${l.crop.w} ${l.crop.h}" preserveAspectRatio="xMidYMid meet"><image href="${esc(l.image)}" x="0" y="0" width="${l.canvas.w}" height="${l.canvas.h}" preserveAspectRatio="none"></image><rect class="damage-box" x="${l.target.x}" y="${l.target.y}" width="${l.target.w}" height="${l.target.h}"></rect></svg></div><p class="damage-caption">《${TITLE}》第${l.page}页，本句第一个问题字局部</p>`;}
  let cases=[],current=0,expanded=false;
  function renderDamage(){const section=document.getElementById("people");if(!section||!cases.length)return;const item=cases[current];publishCases(cases);setMenuTitle(3,"三、碑文残损与AI释读");const tabs=cases.map((e,i)=>`<button class="damage-tab${i===current?" active":""}" data-case-index="${i}" type="button"><b>${esc(e.id)}</b><span class="name">${esc(e.category)}</span></button>`).join(""),analysis=item.analysis.map(line=>`<li>${esc(line)}</li>`).join("");section.className="content-card damage-ai";section.dataset.work027Dedicated="true";section.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><p class="damage-intro">${INTRO}</p><div class="damage-shell"><div class="damage-toolbar"><span class="damage-count">案例 ${current+1} / ${cases.length}</span><div class="damage-heading">${esc(item.category)}——“${esc(item.title)}”</div><div class="damage-pager"><button data-action="prev" type="button" ${current===0?"disabled":""}>‹ 上一个</button><span class="damage-page">${current+1} / ${cases.length}</span><button data-action="next" type="button" ${current===cases.length-1?"disabled":""}>下一个 ›</button></div></div><div class="damage-body"><nav class="damage-list">${tabs}</nav><div class="damage-stage"><section class="damage-card damage-image-card"><h3>拓片原图（局部）</h3>${imageHTML(item)}</section><section class="damage-card damage-analysis"><h3>AI辅助校勘</h3><div class="damage-flow"><div class="damage-block"><span class="damage-label">原始识别（OCR结果）</span><div class="damage-text">${esc(item.original)}</div></div><div class="damage-arrow">↓</div><div class="damage-block"><span class="damage-label">暂未恢复</span><div class="damage-text damage-new">${esc(item.corrected)}</div></div><div class="damage-block"><span class="damage-label">当前上下文</span><div class="damage-restored">${esc(item.corrected)}</div></div><div class="damage-block damage-evidence-block"><span class="damage-label">AI分析依据</span><div class="damage-evidence${expanded?" open":""}"><ol>${analysis}</ol><p><strong>建议置信度：</strong>${esc(item.confidence)}</p></div><button class="damage-expand" data-action="expand" type="button">${expanded?"收起内容⌃":"展开更多⌄"}</button></div></div></section></div></div></div>`;section.querySelectorAll("[data-case-index]").forEach(b=>b.addEventListener("click",()=>{current=Number(b.dataset.caseIndex)||0;expanded=false;renderDamage();}));section.querySelectorAll("[data-action]").forEach(b=>b.addEventListener("click",()=>{if(b.dataset.action==="prev"&&current>0)current--;if(b.dataset.action==="next"&&current<cases.length-1)current++;if(b.dataset.action==="expand")expanded=!expanded;renderDamage();}));section.querySelector(".damage-viewport[data-image]")?.addEventListener("dblclick",e=>{if(typeof window.openZoom==="function")window.openZoom(e.currentTarget.dataset.image);});}
  function ensureStyle(){if(document.getElementById("work027-wei-five-style"))return;const s=document.createElement("style");s.id="work027-wei-five-style";s.textContent=".work027-part-title{margin:26px 0 12px;color:#8b2e24;font-family:'SimSun',serif;font-size:22px}.damage-location-missing{display:flex;align-items:center;justify-content:center;min-height:210px;padding:28px;border:1px dashed #d8c69f;border-radius:14px;background:#fffaf0;color:#7b6c5a}.work027-no-location-map .location-card,.work027-no-location-map .map-card,.work027-no-location-map #locationCard,.work027-no-location-map #locationMapCard,.work027-no-location-map .detail-map-card{display:none!important}";document.head.appendChild(s);}
  function ensureCrowdsource(){const css="assets/css/crowdsource-v9.css";if(!Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(l=>(l.getAttribute("href")||"").split("?")[0].endsWith(css))){const link=document.createElement("link");link.rel="stylesheet";link.href=`${css}?v=${VERSION}`;document.head.appendChild(link);}if(window.__CROWDSOURCE_MISSING_V10__){window.__WORK_027_CROWDSOURCE_READY__=true;return;}const path="assets/js/crowdsource-v9.js";if(!Array.from(document.scripts).some(s=>(s.getAttribute("src")||"").split("?")[0].endsWith(path))){const s=document.createElement("script");s.src=`${path}?v=${VERSION}`;s.async=false;s.addEventListener("load",()=>{window.__WORK_027_CROWDSSOURCE_READY__=true;window.__WORK_027_CROWDSOURCE_READY__=true;window.dispatchEvent(new CustomEvent("work-027-crowdsource-ready",{detail:{count:cases.length}}));},{once:true});document.head.appendChild(s);}else window.__WORK_027_CROWDSOURCE_READY__=true;}
  async function init(){ensureStyle();removeLocationMap();setTimeout(removeLocationMap,120);setTimeout(removeLocationMap,700);try{const [text,rows]=await Promise.all([fetchText(TEXT_URL),fetchJSON(CASE_URL)]);cases=(Array.isArray(rows)?rows:[]).map(normalizeCase);if(!cases.length)throw new Error("027案例数据为空");publishCases(cases);renderTranscript(text,cases);renderDamage();ensureCrowdsource();window.__WORK_027_CONTENT_READY__=true;window.__WORK_027_STABLE_READY__=true;window.dispatchEvent(new CustomEvent("work-027-stable-ready",{detail:{cases:cases.length}}));}catch(error){console.error("[work-027]",error);const a=document.getElementById("calligraphy"),b=document.getElementById("people");if(a)a.innerHTML='<h2 class="section-title">二、碑文释文</h2><div class="full-transcript-error">027碑文数据读取失败，请刷新页面后重试。</div>';if(b)b.innerHTML='<h2 class="section-title">三、碑文残损与AI释读</h2><div class="full-transcript-error">027专属内容读取失败，请刷新页面后重试。</div>';}}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
'''
    (ROOT/"js/work-027.js").write_text(script,encoding="utf-8")


def patch_routes():
    path=ROOT/"js/damage_ai_reading.js"; text=path.read_text(encoding="utf-8")
    text=text.replace("__DAMAGE_AI_READING_ROUTER_V65__","__DAMAGE_AI_READING_ROUTER_V66__",1)
    text=text.replace("window.__DAMAGE_AI_READING_ROUTER_V65__=true;","window.__DAMAGE_AI_READING_ROUTER_V66__=true;\n  window.__DAMAGE_AI_READING_ROUTER_V65__=true;",1)
    marker='''    "026":[\n      {src:"js/work-026-coordinate-adapter.js?v=20260724_magushan_v1",key:"w026c",ready:()=>Boolean(window.__WORK_026_COORDINATE_ADAPTER__)},\n      {src:"js/work-026.js?v=20260724_magushan_v1",key:"w026",ready:()=>Boolean(window.__WORK_026_STABLE_READY__&&window.__WORK_026_CROWDSOURCE_READY__)}\n    ]\n'''
    addition=marker[:-1]+''',\n    "027":[\n      {src:"js/work-027-coordinate-adapter.js?v=20260724_wei_five_v1",key:"w027c",ready:()=>Boolean(window.__WORK_027_COORDINATE_ADAPTER__)},\n      {src:"js/work-027.js?v=20260724_wei_five_v1",key:"w027",ready:()=>Boolean(window.__WORK_027_STABLE_READY__&&window.__WORK_027_CROWDSOURCE_READY__)}\n    ]\n'''
    if '"027":[' not in text:
        if marker not in text: raise RuntimeError("找不到026路由块")
        text=text.replace(marker,addition,1)
    text=text.replace('"026":"麻姑山仙坛记"};','"026":"麻姑山仙坛记","027":"旧拓魏志五种"};')
    text=text.replace('["007","010","011","013","014","015","016","017","018","020","022","023","024","025","026"]','["007","010","011","013","014","015","016","017","018","020","022","023","024","025","026","027"]')
    text=text.replace('["003","004","005","006","007","010","011","013","014","015","016","017","018","020","022","023","024","025","026"]','["003","004","005","006","007","010","011","013","014","015","016","017","018","020","022","023","024","025","026","027"]')
    path.write_text(text,encoding="utf-8")

    path=ROOT/"js/detail_info_patch.js"; text=path.read_text(encoding="utf-8")
    text=text.replace("__DETAIL_INFO_STABLE_ENTRY_V24__","__DETAIL_INFO_STABLE_ENTRY_V25__",1)
    text=text.replace("window.__DETAIL_INFO_STABLE_ENTRY_V24__=true;","window.__DETAIL_INFO_STABLE_ENTRY_V25__=true;\n  window.__DETAIL_INFO_STABLE_ENTRY_V24__=true;",1)
    text=text.replace('const dataUrl="data/beitie_header_info.json?v=20260724_magushan_v1";','const dataUrl="data/beitie_header_info.json?v=20260724_wei_five_v1";')
    text=text.replace('const names={"024":"张从申书李玄靖碑","025":"集王羲之书三藏圣教序","026":"麻姑山仙坛记"};','const names={"024":"张从申书李玄靖碑","025":"集王羲之书三藏圣教序","026":"麻姑山仙坛记","027":"旧拓魏志五种"};')
    text=text.replace('["007","010","011","013","014","015","016","017","018","020","022","023","024","025","026"]','["007","010","011","013","014","015","016","017","018","020","022","023","024","025","026","027"]')
    text=text.replace('script.src="js/damage_ai_reading.js?v=20260724_magushan_v1";','script.src="js/damage_ai_reading.js?v=20260724_wei_five_v1";')
    text=text.replace('applyImmediateWorkMenu();','applyImmediateWorkMenu();\n  if(workId==="027")document.documentElement.classList.add("work027-no-location-map");',1)
    path.write_text(text,encoding="utf-8")

    path=ROOT/"detail.html"; text=path.read_text(encoding="utf-8")
    text=re.sub(r'js/detail_info_patch\.js\?v=[^"<]+','js/detail_info_patch.js?v=20260724_wei_five_v1',text)
    text=re.sub(r'js/damage_ai_reading\.js\?v=[^"<]+','js/damage_ai_reading.js?v=20260724_wei_five_v1',text)
    path.write_text(text,encoding="utf-8")


def main():
    page_data=json.loads((ROOT/"data/page_images_index.json").read_text(encoding="utf-8")); pages=page_data["works"][WORK_ID]["pages"]
    raw=extract_records(json.loads((ROOT/"data/model_boxes/glyph_model_border_026_030.json").read_text(encoding="utf-8")))
    groups=normalize_model_rows(raw,pages); flat=[r for page in sorted(groups) for r in groups[page]]
    cases=build_cases(); mapping=locate_cases(cases,flat)
    total_squares=FULL_TEXT.count("□")
    assert sum(c["square_count"] for c in cases)==total_squares
    assert sum(c["remaining_square_count"] for c in cases)==total_squares
    assert all(c["mode"]=="unresolved" and c["candidate_count"]==0 for c in cases)
    (ROOT/"data/work027_full_text.txt").write_text(FULL_TEXT,encoding="utf-8")
    dump(ROOT/"data/work027_damage_cases.json",cases)
    write_coordinates(groups,len(pages)); update_page_index(groups); update_catalog(len(cases)); update_header(); write_coordinate_adapter(); write_work_script(); patch_routes()
    pages_with=sorted(p for p,rows in groups.items() if rows); no_pages=[p for p in range(1,len(pages)+1) if p not in groups or not groups[p]]
    report={
        "work_id":WORK_ID,"title":TITLE,"digital_pages":len(pages),"model_rows":len(flat),
        "pages_with_coordinates":pages_with,"coordinate_range":[pages_with[0],pages_with[-1]] if pages_with else [],
        "pages_without_coordinates":no_pages,"base_text_square_count":total_squares,
        "model_square_count":mapping["model_square_count"],"case_count":len(cases),"candidate_count":0,
        "remaining_square_count":total_squares,"located_case_count":mapping["located_cases"],
        "unresolved_case_count":len(cases),"documentary_case_count":0,"mixed_case_count":0,"ai_provisional_case_count":0,
        "mapping_method":mapping["mapping_method"],"user_sequence_length":mapping["user_sequence_length"],"model_sequence_length":mapping["model_sequence_length"],
        "map_policy":"027为五种墓志合册，删除统一地点地图卡。",
        "column_four":{"uses_same_cases_as_column_three":True,"case_count":len(cases)},
    }
    dump(ROOT/"data/work027_coordinate_report.json",report)
    print(json.dumps(report,ensure_ascii=False,indent=2))

if __name__=="__main__": main()
