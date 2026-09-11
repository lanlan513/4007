/**
 * 数据库初始化与种子数据
 * 使用 node:sqlite 内置模块，数据库文件位于 db/museum.db
 */
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const DB_PATH = path.join(__dirname, 'museum.db');
const IMG_BASE = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image';

const img = (prompt, size = 'portrait_4_3') =>
  `${IMG_BASE}?prompt=${encodeURIComponent(prompt)}&image_size=${size}`;

// 统一的展品图风格：工笔重彩 + 做旧绢本背景
const ART = (desc) =>
  img(
    `Museum exhibition illustration, ${desc}, traditional Chinese gongbi fine-line painting, ink and mineral pigments on silk, aged rice paper background, full body standing figure, elegant and restrained, highly detailed costume texture, soft even lighting, no text, no watermark`,
    'portrait_4_3'
  );
const HERO = (desc) =>
  img(
    `Panoramic Chinese ink wash painting, ${desc}, misty mountains, subtle mineral color accents on xuan paper, museum banner atmosphere, vast negative space, poetic, no text, no watermark`,
    'landscape_16_9'
  );

const dynasties = [
  {
    id: 'preqin',
    name: '先秦',
    name_en: 'Pre-Qin',
    years: '约前2070 — 前221',
    era: '夏 · 商 · 周 · 春秋战国',
    theme: '#476b5f',
    summary:
      '中国服饰制度的奠基时代。西周确立“上衣下裳”与冠冕礼制，服饰成为等级秩序的象征；春秋战国之际，赵武灵王“胡服骑射”开启民族服饰交融，深衣形制盛行，奠定了华夏衣冠的基本格局。',
    hero: HERO('ancient Chinese pre-Qin era court scene, bronze age ritual vessels, flowing shenyi robes, distant misty mountains'),
  },
  {
    id: 'qinhan',
    name: '秦汉',
    name_en: 'Qin & Han',
    years: '前221 — 公元220',
    era: '秦 · 西汉 · 东汉',
    theme: '#8c3a2e',
    summary:
      '大一统帝国的衣冠秩序。秦尚黑、汉尚赤，袍服成为主流，深衣发展出曲裾、直裾两种样式；官服制度初具规模，佩绶、冠帽区分等级。马王堆汉墓出土的素纱襌衣，代表了当时丝织工艺的巅峰。',
    hero: HERO('Han dynasty Chinese palace courtyard, vermilion pillars, officials in black and red silk robes, silk curtains in wind'),
  },
  {
    id: 'weijin',
    name: '魏晋南北朝',
    name_en: 'Wei, Jin & Southern & Northern Dynasties',
    years: '公元220 — 589',
    era: '三国 · 两晋 · 南北朝',
    theme: '#6d8a83',
    summary:
      '乱世中的衣冠解放与民族大融合。玄学盛行，士族崇尚“褒衣博带”，大袖衫、杂裾垂髾飘逸若仙；北方游牧民族的袴褶、裲裆传入中原，胡汉服饰互相渗透，为盛唐服饰的开放气象埋下伏笔。',
    hero: HERO('Wei-Jin period Chinese literati gathering in bamboo grove, wide-sleeved loose robes, flowing ribbons, celadon tones, mist'),
  },
  {
    id: 'suitang',
    name: '隋唐',
    name_en: 'Sui & Tang',
    years: '公元581 — 907',
    era: '隋 · 唐',
    theme: '#b0702f',
    summary:
      '中国服饰最雍容开放的时代。男子首服幞头、身着圆领缺骻袍，以服色定品阶；女子流行齐胸襦裙，肩披披帛，袒胸装、半臂、胡服并尚，浓丽丰肥、气象万千。丝织印染技艺登峰造极，长安成为世界性的时尚之都。',
    hero: HERO('prosperous Tang dynasty Chang-an street scene, noblewomen in high-waisted ruqun dresses with silk pibo shawls, golden light, peonies'),
  },
  {
    id: 'song',
    name: '宋',
    name_en: 'Song',
    years: '公元960 — 1279',
    era: '北宋 · 南宋',
    theme: '#6f8f9c',
    summary:
      '理性、清雅、瘦硬的服饰美学。受理学影响，服饰趋于拘谨质朴：士人着襕衫、直裰，女子以修长的褙子为尚，配色偏爱天青、牙白等低饱和色。织锦、缂丝工艺精湛，整体风格如宋瓷一般含蓄内敛。',
    hero: HERO('Song dynasty Chinese literati garden, scholar in blue-green lanshan robe, slim woman in beige beizi jacket, rain over lotus pond, ru-ware celadon tones'),
  },
  {
    id: 'yuan',
    name: '元',
    name_en: 'Yuan',
    years: '公元1271 — 1368',
    era: '元',
    theme: '#3d5a80',
    summary:
      '蒙古入主中原带来的草原风貌。质孙服一色成章、辫线袄便于骑射，皮质的答忽、高耸的罟罟冠极具民族特色；同时元代保留宋金服饰遗制，南北风格并存，织金锦（纳石失）极尽华丽。',
    hero: HERO('Yuan dynasty Mongol court on grassland horizon, nobles in gold brocade jisun robes, high gugu headdresses, cobalt blue sky, horses'),
  },
  {
    id: 'ming',
    name: '明',
    name_en: 'Ming',
    years: '公元1368 — 1644',
    era: '明',
    theme: '#a63a2a',
    summary:
      '上溯周汉、重整华夏冠服的集大成时代。官服用补子区分文武品级，乌纱帽、忠靖冠各有定制；赐服中的蟒服、飞鱼服华贵非凡；命妇着凤冠霞帔，民间女子穿马面裙，服饰制度之严整为历代之冠。',
    hero: HERO('Ming dynasty Chinese imperial hall, officials in red round-collar robes with rank badges, phoenix coronet, golden roof tiles, solemn grandeur'),
  },
  {
    id: 'qing',
    name: '清',
    name_en: 'Qing',
    years: '公元1636 — 1912',
    era: '清',
    theme: '#3b5b7a',
    summary:
      '满族服饰与中原礼制的融合。男子剃发易服，着袍褂、马蹄袖，官员以顶戴花翎与补褂辨等级；皇帝明黄龙袍列十二章纹；旗女穿衬衣、氅衣，后发展为近代旗袍。服饰纹饰繁缛、工艺极尽精巧，成为古代服饰史的终章。',
    hero: HERO('Qing dynasty Chinese imperial court, emperor in bright yellow dragon robe with horse-hoof cuffs, officials in blue surcoats, red pillars, snow'),
  },
];

const garments = [
  // ───────────────────────── 先秦 ─────────────────────────
  {
    dynasty: 'preqin', name: '冕服', gender: '男', category: '礼服',
    identity: '帝王、诸侯、卿大夫——周代最高祭服，垂旒与章纹之数随等级递减',
    pattern: '十二章纹：日、月、星辰、山、龙、华虫、宗彝、藻、火、粉米、黼、黻，各有寓意',
    material: '丝帛、麻布，饰以五彩刺绣与织锦',
    form: '上衣下裳制。上衣玄色象征天，下裳纁色象征地；头戴冕冠，顶板前圆后方，垂旒以珠玉串成。',
    colors: '玄（赤黑）衣、纁（绛红）裳，配五彩章纹',
    description:
      '冕服是周代以来帝王、诸侯及卿大夫的最高祭服，《周礼》载有“六冕”之制。衣身绘绣十二章纹——日、月、星辰、山、龙、华虫、宗彝、藻、火、粉米、黼、黻，各有寓意，垂旒数量与章纹多寡严格对应身份等级。它是中国“衣冠治国”礼制思想最完整的物质体现，此后历代帝王冕服皆以此为祖制。',
    image: ART('a pre-Qin Chinese emperor in mianfu ceremonial robe, black upper garment and crimson lower skirt, mian crown with hanging jade bead strings, twelve imperial symbols embroidered'),
  },
  {
    dynasty: 'preqin', name: '玄端', gender: '男', category: '礼服',
    identity: '士大夫、士人——朝祭、冠婚之礼服，天子燕居亦服',
    pattern: '尚素不施纹绣，以方正剪裁与缁色缘边为饰',
    material: '玄色丝帛或细麻布',
    form: '上衣下裳制，衣袂与裳幅皆方正端直，故名“端”；束大带、着舄履。',
    colors: '玄（黑中扬赤）为正色，裳用素、黄或杂色',
    description:
      '玄端是先秦士大夫朝祭、冠婚所穿的端正礼服，因“玄冠、玄衣、玄裳”色皆端正而得名。其剪裁方正平直，寓意品行端方，天子燕居、士大夫祭宗庙皆服之。《论语》称“端章甫，愿为小相焉”，可见玄端在礼仪场合中的庄重地位。',
    image: ART('a pre-Qin Chinese scholar-official in xuanduan formal black robe, square-cut dignified silhouette, black cloth cap, standing respectfully with clasped hands'),
  },
  {
    dynasty: 'preqin', name: '曲裾深衣', gender: '女', category: '常服',
    identity: '贵族妇女，士庶女子亦服',
    pattern: '领缘、袖缘镶织锦，楚地流行云纹、菱纹与凤鸟纹',
    material: '丝帛，边缘以织锦镶边',
    form: '上下连属制。衣襟接长为三角，穿时由前绕至背后缠束，即“续衽钩边”；衣袖宽大，下摆呈喇叭状。',
    colors: '以玄、绛、青、白为主，领缘袖缘饰锦',
    description:
      '深衣出现于春秋战国，“被体深邃”，上衣与下裳连属而不分，是儒家礼制中最具人文含义的服饰。曲裾一式衣襟绕身、曲线优美，在战国楚地尤为流行，楚墓帛画与木俑上屡见不鲜。它兼顾礼仪表率与身体遮蔽，是先秦“衣冠文明”审美与伦理合一的代表。',
    image: ART('a pre-Qin Warring States period Chinese noblewoman in quju shenyi wrap robe, long triangular lapel spiraling around the body, wide sleeves, brocade trim, Chu culture elegance'),
  },
  {
    dynasty: 'preqin', name: '短襦裙', gender: '女', category: '常服',
    identity: '自平民女子至贵族的日常便装',
    pattern: '多素面，裙缘或饰织带与简单几何纹',
    material: '绢、纱等丝织物',
    form: '上衣下裳制。上穿短襦至腰，下着长裙以丝绦系束，即“上衣下裳”的女子便装。',
    colors: '襦色浅淡，裙色以红、紫为尚',
    description:
      '襦裙是中国古代女子延续时间最长的基本装束之一，其雏形在先秦已经出现。短襦紧身、长裙曳地，腰间束帛带，行动利落而不失端庄。与深衣的庄礼相比，襦裙更轻便日常，开后世汉代、隋唐襦裙之先声。',
    image: ART('a pre-Qin Chinese woman in short ru jacket and long skirt, simple Warring States commoner-noble attire, silk sash at waist, modest and neat'),
  },

  // ───────────────────────── 秦汉 ─────────────────────────
  {
    dynasty: 'qinhan', name: '素纱襌衣', gender: '女', category: '礼服',
    identity: '西汉贵族妇女——罩于锦袍之外的礼服',
    pattern: '素面无纹，以方孔纱本身的细密肌理为饰',
    material: '素纱——未经染色的极细桑蚕丝方孔纱',
    form: '上下连属的交领右衽长衣，无衬里，即“襌衣”；轻薄如蝉翼，可罩于锦袍之外。',
    colors: '本白、素色',
    description:
      '1972年长沙马王堆一号汉墓出土的素纱襌衣，衣长128厘米而重量仅49克，薄如烟雾、举之若无，代表了西汉缫丝织造的惊人技艺。贵族妇女将它罩在色彩艳丽的锦袍之外，既增添朦胧层次，又凸显华服纹饰，是汉代含蓄奢华审美趣尚的极致表达。',
    image: ART('a Han dynasty Chinese noblewoman in transparent white silk gauze danyi unlined robe over a patterned brocade garment, featherlight gossamer fabric, Mawangdui style'),
  },
  {
    dynasty: 'qinhan', name: '曲裾袍', gender: '女', category: '常服',
    identity: '贵族妇女、命妇',
    pattern: '云气纹、茱萸纹、乘云绣，缘边织锦对比鲜明',
    material: '绢、罗、锦等丝织物，内填丝绵为袍',
    form: '深衣制长衣，衣襟接曲裾绕身而下，层层包裹；领口、袖口、下摆皆有缘边。',
    colors: '朱红、绛紫、青褐，缘边对比鲜明',
    description:
      '曲裾袍承战国深衣遗制而盛行于西汉，女子穿着尤多。长裾绕身、紧裹下体，既因汉代无裆裤而须严密遮蔽，也形成了静立时长裾曳地、行则裙摆舒展的优美姿态。东汉以后随着有裆裤普及，曲裾渐被直裾取代。',
    image: ART('a Western Han dynasty Chinese noblewoman in quju wrap-around silk robe, lapel spiraling around body, contrasting brocade borders at collar and hem, dignified posture'),
  },
  {
    dynasty: 'qinhan', name: '直裾袍（襜褕）', gender: '男', category: '常服',
    identity: '士人、官吏日常与燕居之服',
    pattern: '素色或暗纹织锦，缘边纯色',
    material: '厚绢或织锦，中纳绵絮',
    form: '深衣制长衣，衣襟直下而非绕身，裾缘垂直；内着裤，外束革带。',
    colors: '皂、绛、青、褐',
    description:
      '直裾袍又称“襜褕”，衣襟从领部直垂而下，不似曲裾绕身。汉代裤制完善后，直裾因穿着便利逐渐流行，成为男子日常与燕居的主要袍服。早期襜褕一度被视为不敬、不可入宫殿，东汉以后则上自天子下至士人皆服，反映了服饰实用化的演变。',
    image: ART('an Eastern Han dynasty Chinese gentleman in zhiju straight-front silk robe, vertical lapel falling straight down, leather belt, black head covering, relaxed scholar posture'),
  },
  {
    dynasty: 'qinhan', name: '文官朝服（进贤冠）', gender: '男', category: '官服',
    identity: '汉代文官——以进贤冠梁数与绶色辨别品级',
    pattern: '袍身素色，印绶织彩，绶之织纹依品级而别',
    material: '皂色或绛色丝帛',
    form: '上衣下裳相连的袍服，外束绅带、佩双印与组绶；头戴进贤冠，以梁数区分贵贱。',
    colors: '皂衣、绛纱，印绶五色纷呈',
    description:
      '汉代官员朝会皆着袍服，头戴进贤冠（文官）或武弁大冠（武官）。最具特色的是“佩绶”制度——官员腰间垂挂系印钮的彩色丝绶，绶的颜色、织法与长度严格对应官阶，一望可知品级。汉官威仪由此奠定，成为后世冠服制度的重要蓝本。',
    image: ART('a Han dynasty Chinese civil official in court robe, black gauze jinxian cap with horizontal ridges, colored silk ribbon shou hanging from waist, formal standing posture'),
  },

  // ───────────────────────── 魏晋南北朝 ─────────────────────────
  {
    dynasty: 'weijin', name: '大袖衫', gender: '女', category: '常服',
    identity: '士族女子、贵妇',
    pattern: '素纱为主，或织隐花暗纹，以飘逸轮廓取胜',
    material: '轻薄纱縠',
    form: '交领或对襟单衫，袖身阔大垂胡，无袖端约束；下配长裙，腰系围裳。',
    colors: '浅青、牙白、淡绯，清雅为主',
    description:
      '魏晋玄学兴起，士族以放达脱俗为高，服饰走向宽博。女子身着大袖衫，两袖舒展几乎及地，“飘如游云、矫若惊龙”。南京西善桥南朝墓《竹林七贤与荣启期》砖画中的宽衣形象，正是这一“褒衣博带”时代精神的写照。',
    image: ART('a Wei-Jin dynasty Chinese woman in extremely wide-sleeved shan blouse, gauzy fabric billowing, long skirt, ethereal bamboo-grove literati aesthetic, carefree elegance'),
  },
  {
    dynasty: 'weijin', name: '杂裾垂髾服', gender: '女', category: '礼服',
    identity: '贵族妇女、宫廷命妇的礼服',
    pattern: '髾片镶锦缘，襳带织花，流行云气与凤鸟纹',
    material: '轻薄丝纱',
    form: '襦裙制而加以“髾”——裙腰垂挂的三角形饰片，与长长飘带（襳）一同随风飞舞。',
    colors: '浅绛、月白、鹅黄，层次轻盈',
    description:
      '杂裾垂髾是魏晋南北朝最具仙气的女装：裙裾上剪出数个三角旗状的“髾”，两侧再缀以长长的丝质飘带“襳”，行步之时层层翻飞，如洛神凌波。顾恺之《洛神赋图》《列女仁智图》中仙女的装束，正是这种服饰的传世图像。',
    image: ART('a Wei-Jin Chinese noblewoman in zaju chuishao fairy dress, triangular silk flags and long streaming ribbons flying from her skirt waist, Goddess of Luo river style, ethereal'),
  },
  {
    dynasty: 'weijin', name: '袴褶', gender: '男', category: '戎服',
    identity: '军中将卒、仪仗卫士，民间男子亦作急装',
    pattern: '素色为主，戎服或缀革带与金属饰件',
    material: '粗绢、麻布或皮革',
    form: '上衣下裤之制：上穿紧身短衣“褶”，下着大口裤“袴”，膝下以带子束扎，便于骑射行动。',
    colors: '玄、皂、赤等耐脏深色',
    description:
      '袴褶源自北方游牧民族，魏晋南北朝时随民族大融合风行中原。大口裤宽松舒适，膝处束结后又利行动，军中将卒、仪仗卫士多服之，民间亦以为常服与急装。它是“胡服骑射”传统在分裂时代的延续，直接影响了唐代常服的构成。',
    image: ART('a Northern and Southern Dynasties Chinese soldier-cavalryman in kuxi outfit, short tight jacket xi and wide trousers tied at knees, leather boots, nomadic Han融合 style'),
  },
  {
    dynasty: 'weijin', name: '裲裆', gender: '男女通用', category: '常服',
    identity: '男女通服，自军士至庶民皆着',
    pattern: '素面为本，军制裲裆铠则缀甲片',
    material: '布帛、丝绵，亦有铁甲制者',
    form: '无袖无领的背心式衣服，仅前后两片，以襻带在肩部与腰间扣连，遮挡心背。',
    colors: '随内外搭配，本色素面为多',
    description:
      '裲裆即“两当”，一片当胸、一片当背，源出军中的裲裆铠，南北朝时演变为男女通服的便装。妇女常将它罩在衫襦之外，或内纳绵絮作冬衣。这种背心式结构简洁实用，是后世半臂、比甲乃至今日马甲背心的远祖。',
    image: ART('a Northern Dynasties Chinese figure wearing liangdang sleeveless vest over a long robe, front and back panels connected at shoulders, simple practical nomadic-inspired garment'),
  },

  // ───────────────────────── 隋唐 ─────────────────────────
  {
    dynasty: 'suitang', name: '圆领缺骻袍', gender: '男', category: '官服',
    identity: '自帝王至庶民通服，以服色辨别官阶',
    pattern: '初尚素色，后织团窠、联珠、宝相花纹',
    material: '绫、罗、绢等丝织物',
    form: '圆领、窄袖、左右开衩（缺骻）的及膝长袍；头戴幞头，腰系銙带，足着乌皮靴。',
    colors: '三品以上紫，五品以上绯，七品以上绿，九品以上青——“品色衣”',
    description:
      '圆领袍是隋唐男子的核心装束，从帝王到庶民通服，以颜色区分官阶，即“品色衣”制度。幞头由鲜卑帽演变而来，软脚、硬脚样式屡变；腰间銙带挂算囊、刀子等七事。这套“幞头、圆领袍、銙带、长靴”的组合沿用至明，成为中国男子常服的经典范式。',
    image: ART('a Tang dynasty Chinese official in round-collar quegua robe with side slits, black futo headcloth, leather belt with plaques, black leather boots, purple or crimson official color'),
  },
  {
    dynasty: 'suitang', name: '齐胸襦裙', gender: '女', category: '常服',
    identity: '宫廷贵妇至士庶女子皆尚',
    pattern: '缬染团花、蹙金绣、间色裙，石榴红最负盛名',
    material: '锦、罗、纱、缬染丝帛',
    form: '短襦或衫束于裙内，裙腰高束至胸腋以上，以锦带系结；肩绕长帛“披帛”，可加半臂。',
    colors: '石榴红、郁金黄、草绿、间色裙，浓丽明艳',
    description:
      '齐胸襦裙是盛唐女装的标志：裙腰束于胸前，裙摆修长丰垂，上配窄袖短襦，肩披轻薄披帛，间以半臂、袒领，开放而华贵。唐代贵妇以丰肌为美，裙色喜石榴红、郁金裙，缬染、织锦、蹙金绣并用。周昉《簪花仕女图》中薄纱笼覆的女子，正是大唐气象的传神定格。',
    image: ART('a Tang dynasty Chinese noblewoman in high-waisted chest ruqun dress, pomegranate red skirt, low-cut short ru jacket, long silk pibo shawl draped over shoulders, plump elegant Tang beauty'),
  },
  {
    dynasty: 'suitang', name: '袆衣', gender: '女', category: '礼服',
    identity: '皇后——受册、助祭、朝会的最高礼服',
    pattern: '深青地遍织五彩翟（雉鸡）纹，行列成对',
    material: '深色织锦，施以五彩翟纹织成',
    form: '上下连属的深青色礼服，遍织翟（雉鸡）纹为章，配素纱中单、蔽膝，首戴花树冠、饰两博鬓。',
    colors: '深青（绀）地，五彩翟纹',
    description:
      '袆衣是唐代皇后受册、助祭、朝会的最高礼服，取“翚雉”（五彩雉鸡）之纹遍织于衣，行列成对、秩序井然，象征后妃之德。其制渊源周汉，唐始完备，宋明沿袭不废。与帝王冕服相对，袆衣是中国古代女性礼服体系中等级最高、最隆重的一章。',
    image: ART('a Tang dynasty Chinese empress in huiyi ceremonial robe, deep indigo silk woven with paired golden pheasant patterns, ornate floral crown with side ornaments, solemn majesty'),
  },
  {
    dynasty: 'suitang', name: '半臂', gender: '女', category: '常服',
    identity: '男女皆尚，女子多罩于襦衫之外',
    pattern: '联珠纹、团窠纹、对鸟对兽等西域风织锦',
    material: '锦、绫等较厚实丝织物',
    form: '短袖及肘的对襟或套头上衣，长至腰际，罩于襦衫之外；男子亦有穿者。',
    colors: '织锦半臂以联珠纹、团窠纹为贵',
    description:
      '半臂即短袖上衣，隋唐男女皆尚，女子常罩在长袖襦衫之外，形成长短袖叠穿的层次。唐代织锦工艺发达，西域风格的联珠团窠纹锦半臂尤为名贵。它与披帛、襦裙、幞头靴一样，是大唐兼容并蓄、胡风汉韵交织的时尚缩影。',
    image: ART('a Tang dynasty Chinese woman wearing banbi short-sleeved brocade over-jacket over long-sleeved ru blouse, pearl roundel medallion pattern, high-waisted skirt, cosmopolitan Tang fashion'),
  },

  // ───────────────────────── 宋 ─────────────────────────
  {
    dynasty: 'song', name: '褙子', gender: '女', category: '常服',
    identity: '后妃至市井女子通服，男子亦有着者',
    pattern: '衣身素色或暗纹，缘边印金、刺绣花卉',
    material: '罗、绫、纱，边缘以印金或刺绣缘饰',
    form: '对襟、直领、窄袖的长外衣，衣身修长过膝，两侧腋下开高衩，不施纽襻、任其敞开。',
    colors: '淡蓝、牙白、藕色、浅褐等低饱和色',
    description:
      '褙子（背子）是宋代最具代表性的女装：对襟直领、线条瘦长、腋下开衩，穿时不作合纽，仅以腰带或内里的抹胸、襦裙相配，风格修长清雅。上自后妃、下至市井女子皆服，男子亦有穿褙子者。它体现了宋代理性内敛、去繁就简的审美，如宋瓷般含蓄耐看。',
    image: ART('a Song dynasty Chinese woman in beizi long front-opening jacket, straight collar, slim fitted silhouette, high side slits, subtle pale blue silk, refined restrained elegance'),
  },
  {
    dynasty: 'song', name: '襕衫', gender: '男', category: '官服',
    identity: '士人、新科进士与官员的常服',
    pattern: '素面无纹，以下摆横襕为识',
    material: '细白布或皂色罗',
    form: '圆领、大袖、下摆施一横“襕”的长衫，以象征上衣下裳之古制；腰束丝绦，头戴幞头或巾。',
    colors: '白衣举子、皂色官员，下摆横襕为识',
    description:
      '襕衫是宋代士人、进士与官员的常服，圆领大袖而于膝处横接一道衣料“襕”，以示不忘上古上衣下裳之制。新科进士释褐皆着白襕衫，“白袍举子”成为宋代科举文化的经典意象。它以简约的符号接续礼制，是宋儒“复古而实用”服饰观的体现。',
    image: ART('a Song dynasty Chinese scholar in lanshan round-collar long gown with horizontal band at knee, white cloth for examination candidates, black futo cap, refined literati bearing'),
  },
  {
    dynasty: 'song', name: '大袖', gender: '女', category: '礼服',
    identity: '后妃、命妇——册封、婚礼等大礼所服',
    pattern: '金绣云凤、缠枝花卉，霞帔绣禽鸟随品级而别',
    material: '罗、绫，配金绣',
    form: '两袖阔大的对襟长衣，配长裙、霞帔，首戴珠翠团冠；内以“兜子”收纳双手。',
    colors: '青、绯、紫按命妇等级',
    description:
      '大袖是宋代后妃、命妇的正式礼服，因衣袖宽大而得名，与霞帔、团冠相配，用于册封、婚礼等大礼。平日则着褙子。宋人婚礼中“新人着大袖、戴盖头”的记载，说明大袖已成为当时女性身份与仪式感的重要标志。',
    image: ART('a Song dynasty Chinese titled court lady in daxiu wide-sleeved formal robe, jade-pearl crown, embroidered xiapei stole, dignified ceremonial posture, muted refined colors'),
  },
  {
    dynasty: 'song', name: '直裰', gender: '男', category: '常服',
    identity: '文人、僧道居家燕处之便服',
    pattern: '素净无纹，不施雕饰',
    material: '素色布帛或细罗',
    form: '交领、长身、两侧开衩的便服，无横襕；腰间束绦，头戴巾子或东坡巾。',
    colors: '皂、白、青灰，素净为常',
    description:
      '直裰（直掇）是宋代文人、僧道居家燕处的便服，交领长身、线条素净。苏东坡、黄山谷等士人画像中常见这种装束：巾服萧然、意态闲适。它不施纹饰、不辨官阶，代表了宋代士大夫退朝之后追求的平淡天真之境。',
    image: ART('a Song dynasty Chinese literati in zhiduo plain cross-collar long robe, cloth dongpo headwrap, waist sash, serene scholarly posture in a bamboo study, minimalist ink aesthetic'),
  },

  // ───────────────────────── 元 ─────────────────────────
  {
    dynasty: 'yuan', name: '质孙服', gender: '男', category: '礼服',
    identity: '皇帝与宗王、近侍——诈马宴上君臣同服一色',
    pattern: '纳石失织金：缠枝、云龙、宝相花，缀珠翠金宝',
    material: '纳石失（织金锦）、缀大珠的名贵丝料',
    form: '上衣连下裳、窄袖、腰间密密打作细褶的一体式袍服，首戴钹笠冠或七宝重顶冠。',
    colors: '一色成章——每次宴会君臣同服一种颜色',
    description:
      '质孙（又译只孙、济逊）是元代宫廷最隆重的宴服，蒙语意为“颜色”。天子大宴“诈马宴”时，与会者每日更换同色质孙，连服三日，衣上缀满珠翠金宝，皆为西域织金工匠所造纳石失。它把游牧民族的“一色聚宴”习俗与中原丝织精华合为一体，奢华空前。',
    image: ART('a Yuan dynasty Mongol noble in zhixun jixun robe, gold brocade nasij fabric all in one color, tight waist pleats, jeweled hat, lavish court banquet attire'),
  },
  {
    dynasty: 'yuan', name: '辫线袄', gender: '男', category: '戎服',
    identity: '皇帝、近侍、卫士与乐工',
    pattern: '腰间辫线细褶与肩背穗子为饰',
    material: '绢、锦，腰部分以丝线辫缝',
    form: '窄袖紧身短袄，腰间以红帛拈线密辫成横向细褶（腰线），下裳束入裤靴；肩背常缀辫线穗子。',
    colors: '辫线多为红、紫，袄身随品给赐',
    description:
      '辫线袄是元代最具特色的骑射之服：腰腹间用丝线辫出密集的横向襞褶，既收紧腰身、利於弓马，又有装饰之美。元代皇帝的“辫线”与近侍的“只孙”同为赐服，卫士、乐工皆服。这种收腰打褶的结构下启明代曳撒，影响深远。',
    image: ART('a Yuan dynasty Mongol guardsman in braided-cord ao jacket, densely pleated braided silk waistband, tight sleeves, trousers tucked into boots, equestrian martial attire'),
  },
  {
    dynasty: 'yuan', name: '答忽（皮袍）', gender: '男', category: '常服',
    identity: '蒙古君臣冬服，汉人士庶亦效之',
    pattern: '皮毛本色，以金缘镶边为贵',
    material: '貂鼠、羊皮等毛皮，或以丝锦作面',
    form: '对襟、短袖或无袖的外罩长皮袄，罩于长袍之外，皮毛朝里或翻缘出锋；束腰、着靴。',
    colors: '玄、皂、褐，金缘为贵',
    description:
      '答忽（搭护）是蒙古人的传统外罩皮衣，对襟而袖短，罩在长袍外御寒，入元后君臣皆服，冬季尤尚。南方汉族士人亦随之穿着，文献中“罩甲”“比甲”的流行与此有关。它是草原御寒智慧进入中原服制的典型例证。',
    image: ART('a Yuan dynasty Mongol man in dahu fur surcoat, short-sleeved sheepskin and sable outer robe over a long inner robe, fur trim visible, leather boots, steppe winter attire'),
  },
  {
    dynasty: 'yuan', name: '罟罟冠', gender: '女', category: '礼服',
    identity: '蒙古贵族妇女——冠饰轻重直接标示身份高低',
    pattern: '珠翠花钿、金箔饰件，顶插雉尾翠花',
    material: '桦树皮、铁丝为骨，外蒙青毡或红绢，饰珠翠花钿',
    form: '高耸两三尺的柱状冠，顶呈方形或花簇状，插雉尾、翠花；配合宽大的袍服穿着。',
    colors: '青、红为主，金珠点缀',
    description:
      '罟罟冠（又译姑姑、固姑）是元代蒙古贵族妇女最醒目的标志：以桦木为骨、外蒙丝毡，高可两三尺，顶上再插满珠翠与长长的雉尾，远望如神人。元人诗曰“要知各位高低处，都在姑姑帽上看”——冠的饰物轻重直接标示身份，是蒙元服饰文化最独特的风景。',
    image: ART('a Yuan dynasty Mongol noblewoman wearing towering gugu boktak headdress, tall cylindrical red and black felt crown with feathers and pearls, wide long robe, distinctive steppe noble fashion'),
  },

  // ───────────────────────── 明 ─────────────────────────
  {
    dynasty: 'ming', name: '补服', gender: '男', category: '官服',
    identity: '文武官员——补子文禽武兽辨别九品',
    pattern: '补子：文官仙鹤、锦鸡、孔雀等禽鸟，武官狮、虎、豹等走兽',
    material: '苎丝、绫罗等丝织物',
    form: '圆领、大袖的盘领袍，胸背前后各缀一方“补子”；头戴乌纱帽，腰束玉带。',
    colors: '一至四品绯，五至七品青，八九品绿；补子文禽武兽',
    description:
      '补服是明代官员的公服，最具特色的是胸前背后的“补子”：文官绣飞禽（仙鹤、锦鸡、孔雀……），武官绣走兽（狮子、虎、豹……），品级一望可知。此制上承元代胸背、下启清代补褂，成为中国官服文化最广为人知的符号。头戴乌纱帽、腰悬牙牌，构成今人最熟悉的“大明衣冠”。',
    image: ART('a Ming dynasty Chinese civil official in bufU rank robe, red round-collar silk robe with square golden pheasant rank badge on chest and back, black wusha gauze cap, jade belt'),
  },
  {
    dynasty: 'ming', name: '飞鱼服', gender: '男', category: '官服',
    identity: '锦衣卫堂上官、大内近侍——非特赐不得服',
    pattern: '飞鱼纹：蟒首鱼尾、四爪有翼，遍织全身',
    material: '大红织锦或妆花罗',
    form: '交领或直领的曳撒式袍，全身织成飞鱼纹——蟒首、鱼身、有翼鱼尾；配绣春刀、鸾带。',
    colors: '大红地金纹为上',
    description:
      '飞鱼服是明代仅次于蟒服的尊贵赐服，纹作蟒首鱼尾、四爪有翼，非特赐不得服。锦衣卫堂上官、大内太监随侍时多蒙恩赏穿之，绣春刀、飞鱼服遂成为明代宫廷最具传奇色彩的形象。与麒麟服、斗牛服并称“赐服”，是皇权恩宠的直接象征。',
    image: ART('a Ming dynasty Chinese imperial guard in flying-fish feiyu bestowed robe, crimson brocade with golden winged dragon-fish pattern, yesa pleated waist, embroidered spring saber, imposing'),
  },
  {
    dynasty: 'ming', name: '凤冠霞帔', gender: '女', category: '礼服',
    identity: '后妃、命妇的最高礼服；民间女子出嫁可借服一日',
    pattern: '凤冠点翠龙凤珠花，霞帔绣云霞禽鸟随夫、子品级而变',
    material: '漆竹丝冠胎点翠饰金龙金凤，霞帔以织金锦罗制成',
    form: '凤冠以点翠、珠花、金龙金凤与珠滴组成；霞帔为两条绣满云霞禽鸟的长帛，自肩披绕、末端坠金坠子；配大红大袖袍。',
    colors: '点翠蓝、金、朱红',
    description:
      '凤冠霞帔是明代后妃与命妇的最高礼服，也是民间女子出嫁可“借服”的人生华服。凤冠点翠嵌珠、龙凤衔珠滴；霞帔两条平行绣帔垂于身前，纹样随夫、子品级而变（一品仙鹤、二品锦鸡……）。直至近代，“凤冠霞帔”仍是中国人对隆重婚礼最经典的想象。',
    image: ART('a Ming dynasty Chinese noble bride in phoenix coronet and xiapei, kingfisher-feather blue phoenix crown with golden dragons and pearl tassels, red embroidered cape with rank bird medallions'),
  },
  {
    dynasty: 'ming', name: '马面裙', gender: '女', category: '常服',
    identity: '命妇至民间女子皆服',
    pattern: '裙襕织金妆花：花鸟、龙云、璎珞纹',
    material: '缎、绸、织金妆花',
    form: '裙门重叠、两侧打褶的裙式：前后各有一段光面无褶的“马面”，裙襕织绣花鸟龙云；上配竖领长袄。',
    colors: '大红、宝蓝、墨绿，裙襕金彩辉煌',
    description:
      '马面裙是明代女装最具结构智慧的创造：裙身由四大裙门拼合，前后里外共有四个裙门，重合处称“马面”，两侧打褶，既端庄平整又利於行走。裙门与裙摆常织绣华丽的“裙襕”纹样。上配竖领大袖袄、内着裤，这套“袄裙”装束一直延续至民国，是汉服复兴运动中最具辨识度的裙式之一。',
    image: ART('a Ming dynasty Chinese woman in mamianqun horse-face pleated skirt with ornate gold woven border panels, high-collar long ao jacket, structured pleats, elegant civilian fashion'),
  },

  // ───────────────────────── 清 ─────────────────────────
  {
    dynasty: 'qing', name: '明黄龙袍', gender: '男', category: '礼服',
    identity: '皇帝独占——一般庆典所着吉服',
    pattern: '九龙纹、十二章，间以祥云、蝠寿与海水江崖纹',
    material: '明黄妆花缎、缂丝，绣金线',
    form: '右衽大襟、马蹄袖的长袍，列十二章纹，龙纹九龙（身见五龙）；领、袖俱石青色，缘海龙皮边。',
    colors: '明黄为皇帝独占，石青缘边，金线龙纹',
    description:
      '清代龙袍是皇帝吉服，以明黄色缎绣九龙十二章，龙纹矫健、祥云蝠寿遍布其间。袖口的“马蹄袖”源出骑射，行礼时翻掸成礼，是满服最典型的符号。龙袍只用于一般庆典，祭祀大典另着朝服；其色彩、纹样、纽扣数目皆有严格则例，代表了古代服饰等级制度的最后高峰。',
    image: ART('a Qing dynasty Chinese emperor in bright yellow dragon robe, nine golden five-clawed dragons among clouds, horse-hoof cuffs in dark blue, twelve imperial symbols, solemn imperial majesty'),
  },
  {
    dynasty: 'qing', name: '补褂（清代补服）', gender: '男', category: '官服',
    identity: '文武官员——顶戴花翎与补子共辨品级',
    pattern: '补子文禽武兽，较明代略小、对襟分作两半',
    material: '石青色绸、缎',
    form: '对襟、短于袍、袖端平的外褂，胸背缀补子；内穿蟒袍，颈挂朝珠，头戴顶戴花翎。',
    colors: '石青为常，顶戴分红、蓝、白、金，花翎分单眼双眼三眼',
    description:
      '清代官员礼服为“袍褂”组合：内着蟒袍、外罩石青色补褂。补子比明代略小而分两半（对襟所截），仍论文禽武兽；品级高下全看“顶戴花翎”——帽顶珠色与孔雀翎眼数标定身份，“摘去顶戴花翎”即夺职。这套体系与剃发易服令一起，构成了清代衣冠政治的鲜明面貌。',
    image: ART('a Qing dynasty Chinese official in dark blue bu gua surcoat with square rank badge split at front opening, mandarin hat with colored finial button and peacock feather, court beads around neck'),
  },
  {
    dynasty: 'qing', name: '旗装（衬衣 · 氅衣）', gender: '女', category: '常服',
    identity: '旗人妇女的日常装束',
    pattern: '多重镶滚花边（晚清有“十八镶”之称），刺绣花卉蝶鸟',
    material: '绸缎纱罗，四季换料，多刺绣花边',
    form: '圆领、大襟右衽、宽身直筒的长袍：衬衣无开衩为内搭，氅衣左右开衩、缘多重滚边为外罩；梳两把头、穿花盆底鞋。',
    colors: '晚清尚藕荷、湖蓝、月白，镶边繁复',
    description:
      '旗女穿宽大直筒长袍，不系裙，内着衬衣、外罩氅衣，晚清时滚边越镶越宽，有“十八镶”之称。辛亥革命后，旗装经剪裁收腰、曲线合体，演变为近代旗袍，成为民国女性的“国服”。从满族长袍到上海旗袍，这是中国古代服饰向现代时装过渡最直接的一脉。',
    image: ART('a Qing dynasty Manchu noblewoman in qizhuang long robe, chenyi or changyi banner gown with wide embroidered trim at collar cuffs and side slits, liangbatou headdress, flower-pot shoes'),
  },
  {
    dynasty: 'qing', name: '黄马褂', gender: '男', category: '戎服',
    identity: '御前侍卫之“职任褂子”，或行围、军功特赏之服',
    pattern: '明黄素面或暗纹织花，以服色本身为最高标识',
    material: '明黄色纱或绸',
    form: '对襟、平袖、长至胯下的短褂，行袍之外罩穿；骑马行服之制。',
    colors: '明黄——与天子同色，非赏穿不得用',
    description:
      '马褂源出满洲行服，短衣短袖便于骑射，本为军中扈从之服。其中明黄色“黄马褂”最为尊贵：或为御前侍卫“职任褂子”，或为行围、军功特赏的“赏穿”之服，得者被视为旷世恩荣。晚清李鸿章等人获赏穿黄马褂，成为小说戏曲中最熟悉的清代权贵形象。马褂本身也流入民间，与长袍相配，成为民国男子的标准装束。',
    image: ART('a Qing dynasty imperial guardsman in bright yellow magua short riding jacket over a long robe, front-buttoned flat-sleeved surcoat, mandarin hat, mounted escort attire'),
  },
];

// ───────────────────────── 初始化 ─────────────────────────
function init() {
  if (fs.existsSync(DB_PATH)) fs.rmSync(DB_PATH);
  const db = new DatabaseSync(DB_PATH);

  db.exec(`
    CREATE TABLE dynasties (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_en TEXT,
      years TEXT,
      era TEXT,
      theme TEXT,
      summary TEXT,
      hero TEXT,
      sort_order INTEGER
    );
    CREATE TABLE garments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dynasty_id TEXT NOT NULL REFERENCES dynasties(id),
      name TEXT NOT NULL,
      gender TEXT NOT NULL,
      category TEXT NOT NULL,
      identity TEXT,
      material TEXT,
      form TEXT,
      colors TEXT,
      pattern TEXT,
      description TEXT,
      image TEXT
    );
  `);

  const insD = db.prepare(
    `INSERT INTO dynasties (id, name, name_en, years, era, theme, summary, hero, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insG = db.prepare(
    `INSERT INTO garments (dynasty_id, name, gender, category, identity, material, form, colors, pattern, description, image)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  dynasties.forEach((d, i) =>
    insD.run(d.id, d.name, d.name_en, d.years, d.era, d.theme, d.summary, d.hero, i)
  );
  let count = 0;
  for (const g of garments) {
    insG.run(g.dynasty, g.name, g.gender, g.category, g.identity, g.material, g.form, g.colors, g.pattern, g.description, g.image);
    count++;
  }

  console.log(`✔ 数据库已创建：${DB_PATH}`);
  console.log(`✔ 朝代 ${dynasties.length} 个，服饰 ${count} 件`);
  db.close();
}

init();
