
    /*!
    * timepicker.js - v3.1.0
    * Built: Mon Feb 22 2021 10:34:56 GMT-0300 (Brasilia Standard Time)
    */
  
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.TimePicker = factory());
}(this, (function () { 'use strict';

  var EVENT_TYPE = {
    open: 'open',
    close: 'close',
    change: 'change',
    startFadeIn: 'start-fade-in',
    endFadeIn: 'end-fade-in',
    startFadeOut: 'start-fade-out',
    endFadeOut: 'end-fade-out',
  };

  var DEFAULT_OPTIONS = {
    lang: 'en',
    theme: 'dark',
  };

  var FOCUSABLE = /^(?:input|[s\u017F]elect|textarea|button|object)$/i;

  var CLICKABLE = /^(?:a|area)$/i;

  var LANG = {
    en: { hour: 'Hour', minute: 'Minute' },
    pt: { hour: 'Hora', minute: 'Minuto' },
    de: { hour: 'Stunde', minute: 'Minute' },
    es: { hour: 'Hora', minute: 'Minuto' },
    fr: { hour: 'Heure', minute: 'minute' },
    it: { hour: 'Ora', minute: 'minuto' },
    nl: { hour: 'Uur', minute: 'minuut' },
    sv: { hour: 'Timmars', minute: 'minut' },
  };

  function assert(condition, message) {
    if ( message === void 0 ) message = 'Assertion failed';

    if (!condition) {
      if (typeof Error !== 'undefined') { throw new Error(message); }

      throw message; // Fallback
    }
  }

  /**
   * @param {Function} emitter
   * @param {Element} element
   * @param {Object} config
   */
  function fade(ref) {
    var emitter = ref.emitter;
    var element = ref.element;
    var time = ref.time; if ( time === void 0 ) time = 300;
    var action = ref.action; if ( action === void 0 ) action = 'in';

    var start = null;
    var requestId;

    var ref$1 =
      action === 'in'
        ? [EVENT_TYPE.startFadeIn, EVENT_TYPE.endFadeIn]
        : [EVENT_TYPE.startFadeOut, EVENT_TYPE.endFadeOut];
    var evtStart = ref$1[0];
    var evtEnd = ref$1[1];

    var tick = function (timestamp) {
      if (!start) {
        emitter.emit(evtStart, { target: element });
        start = timestamp;
      }

      var opacity =
        action === 'in'
          ? Number(element.style.opacity) + (timestamp - start) / time
          : Number(element.style.opacity) - (timestamp - start) / time;

      var finished = action === 'in' ? opacity >= 1 : opacity <= 0;

      element.style.opacity = opacity;

      if (finished) {
        emitter.emit(evtEnd, { target: element });
      } else {
        requestId = window.requestAnimationFrame(tick);
      }
    };

    requestId = window.requestAnimationFrame(tick);

    return requestId;
  }

  /**
   * @param {Element|Array<Element>} element DOM node or array of nodes.
   * @param {String|Array<String>} classname Class or array of classes.
   * For example: 'class1 class2' or ['class1', 'class2']
   */
  function addClass(element, classname) {
    if (Array.isArray(element)) {
      element.forEach(function (each) { return addClass(each, classname); });

      return;
    }

    var array = Array.isArray(classname) ? classname : classname.split(/[\t-\r \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]+/);

    var i = array.length;

    while (i--) {
      if (!hasClass(element, array[i])) {
        if (element.classList) {
          element.classList.add(array[i]);
        } else {
          element.className = ((element.className) + " " + (array[i])).trim();
        }
      }
    }
  }

  /**
   * @param {Element|Array<Element>} element DOM node or array of nodes.
   * @param {String|Array<String>} classname Class or array of classes.
   * For example: 'class1 class2' or ['class1', 'class2']
   * @param {Number|undefined} timeout Timeout to add a class.
   */
  function removeClass(element, classname) {
    if (Array.isArray(element) || NodeList.prototype.isPrototypeOf(element)) {
      element.forEach(function (each) { return removeClass(each, classname); });

      return;
    }

    var array = Array.isArray(classname) ? classname : classname.split(/[\t-\r \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]+/);

    var i = array.length;

    while (i--) {
      if (hasClass(element, array[i])) {
        if (element.classList) {
          element.classList.remove(array[i]);
        } else {
          element.className = element.className.replace(classRegex(array[i]), ' ').trim();
        }
      }
    }
  }

  /**
   * @param {Element} element DOM node.
   * @param {String} classname Classname.
   * @return {Boolean}
   */
  function hasClass(element, classname) {
    // use native if available
    return element.classList
      ? element.classList.contains(classname)
      : classRegex(classname).test(element.className);
  }

  function isElement(object) {
    // DOM, Level2
    if ('HTMLElement' in window) {
      return !!object && object instanceof HTMLElement;
    }

    // Older browsers
    return !!object && typeof object === 'object' && object.nodeType === 1 && !!object.nodeName;
  }

  function createElement(node, html) {
    var element;

    if (Array.isArray(node)) {
      element = document.createElement(node[0]);

      if (node[1].id) { element.id = node[1].id; }

      if (node[1].classname) { element.className = node[1].classname; }

      if (node[1].attr) {
        var ref = node[1];
        var attr = ref.attr;

        if (Array.isArray(attr)) {
          var i = -1;

          while (++i < attr.length) {
            element.setAttribute(attr[i].name, attr[i].value);
          }
        } else {
          element.setAttribute(attr.name, attr.value);
        }
      }
    } else {
      element = document.createElement(node);
    }

    element.innerHTML = html;

    var frag = document.createDocumentFragment();

    while (element.childNodes[0]) { frag.append(element.childNodes[0]); }

    element.append(frag);

    return element;
  }

  function getWindowSize() {
    return {
      width: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,

      height:
        window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight,
    };
  }

  function getMaxZIndex() {
    return Array.from(document.querySelectorAll('body *'), function (el) { return Number.parseFloat(window.getComputedStyle(el).zIndex); }
    )
      .filter(function (zIndex) { return !Number.isNaN(zIndex); })
      .reduce(function (accumulator, current) { return (current > accumulator ? current : accumulator); }, 0);
  }

  function getOffset(element) {
    var rect = element.getBoundingClientRect();
    var documentElement = document.documentElement;
    var left = rect.left + window.pageXOffset - documentElement.clientLeft;
    var top = rect.top + window.pageYOffset - documentElement.clientTop;
    var width = element.offsetWidth;
    var height = element.offsetHeight;
    var right = left + width;
    var bottom = top + height;

    return { width: width, height: height, top: top, bottom: bottom, right: right, left: left };
  }

  function classRegex(classname) {
    // eslint-disable-next-line security/detect-non-literal-regexp
    return new RegExp(("(^|\\s+) " + classname + " (\\s+|$)"), 'u');
  }

  function getHour(element) {
    return element.getAttribute('data-hour');
  }

  function getMinute(element) {
    return element.getAttribute('data-minute');
  }

  function styleInject(css, ref) {
    if ( ref === void 0 ) { ref = {}; }
    var insertAt = ref.insertAt;

    if (!css || typeof document === 'undefined') { return; }

    var head = document.head || document.getElementsByTagName('head')[0];
    var style = document.createElement('style');
    style.type = 'text/css';

    if (insertAt === 'top') {
      if (head.firstChild) {
        head.insertBefore(style, head.firstChild);
      } else {
        head.appendChild(style);
      }
    } else {
      head.appendChild(style);
    }

    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }
  }

  var css_248z = ".main_container__1GGJE{position:absolute;width:260px;height:140px;padding:0;background:#fff;font-family:inherit;font-weight:400;overflow:hidden;border-radius:3px;box-sizing:border-box;line-height:1rem;font-size:1rem}.main_container__1GGJE a,.main_container__1GGJE abbr,.main_container__1GGJE acronym,.main_container__1GGJE address,.main_container__1GGJE applet,.main_container__1GGJE article,.main_container__1GGJE aside,.main_container__1GGJE audio,.main_container__1GGJE b,.main_container__1GGJE big,.main_container__1GGJE blockquote,.main_container__1GGJE canvas,.main_container__1GGJE caption,.main_container__1GGJE center,.main_container__1GGJE cite,.main_container__1GGJE code,.main_container__1GGJE dd,.main_container__1GGJE del,.main_container__1GGJE details,.main_container__1GGJE dfn,.main_container__1GGJE div,.main_container__1GGJE dl,.main_container__1GGJE dt,.main_container__1GGJE em,.main_container__1GGJE embed,.main_container__1GGJE fieldset,.main_container__1GGJE figcaption,.main_container__1GGJE figure,.main_container__1GGJE footer,.main_container__1GGJE form,.main_container__1GGJE h1,.main_container__1GGJE h2,.main_container__1GGJE h3,.main_container__1GGJE h4,.main_container__1GGJE h5,.main_container__1GGJE h6,.main_container__1GGJE header,.main_container__1GGJE hgroup,.main_container__1GGJE i,.main_container__1GGJE iframe,.main_container__1GGJE img,.main_container__1GGJE ins,.main_container__1GGJE kbd,.main_container__1GGJE label,.main_container__1GGJE legend,.main_container__1GGJE li,.main_container__1GGJE mark,.main_container__1GGJE menu,.main_container__1GGJE nav,.main_container__1GGJE object,.main_container__1GGJE ol,.main_container__1GGJE output,.main_container__1GGJE p,.main_container__1GGJE pre,.main_container__1GGJE q,.main_container__1GGJE ruby,.main_container__1GGJE s,.main_container__1GGJE samp,.main_container__1GGJE section,.main_container__1GGJE small,.main_container__1GGJE span,.main_container__1GGJE strike,.main_container__1GGJE strong,.main_container__1GGJE sub,.main_container__1GGJE summary,.main_container__1GGJE sup,.main_container__1GGJE table,.main_container__1GGJE tbody,.main_container__1GGJE td,.main_container__1GGJE tfoot,.main_container__1GGJE th,.main_container__1GGJE thead,.main_container__1GGJE time,.main_container__1GGJE tr,.main_container__1GGJE tt,.main_container__1GGJE u,.main_container__1GGJE ul,.main_container__1GGJE var,.main_container__1GGJE video{margin:0;padding:0;border:0;font:inherit;font-size:100%;vertical-align:baseline}.main_container__1GGJE table{border-collapse:collapse;border-spacing:0}.main_container__1GGJE caption,.main_container__1GGJE td,.main_container__1GGJE th{text-align:left;font-weight:400;vertical-align:middle}.main_container__1GGJE blockquote,.main_container__1GGJE q{quotes:none}.main_container__1GGJE blockquote:after,.main_container__1GGJE blockquote:before,.main_container__1GGJE q:after,.main_container__1GGJE q:before{content:\"\";content:none}.main_container__1GGJE a img{border:none}.main_container__1GGJE *,.main_container__1GGJE :after,.main_container__1GGJE :before{box-sizing:inherit}.main_container__1GGJE *,.main_container__1GGJE .main_active__1rd16,.main_container__1GGJE :focus,.main_container__1GGJE :hover{text-decoration:none;outline:none}.main_container__1GGJE.main_dragging__1Zr7i{opacity:.85!important}.main_container__1GGJE.main_dragging__1Zr7i .main_dragTarget__2aNst{cursor:grabbing}.main_table__j8SHe{position:relative;width:100%}.main_table__j8SHe tbody:before{content:\"\";display:block;height:7px}.main_table__j8SHe .main_header__3DmbH{font-weight:600;padding:5px}.main_table__j8SHe .main_header__3DmbH,.main_table__j8SHe td{text-align:center}.main_table__j8SHe td>a{display:inline-block;padding:3px 0;width:25px;color:inherit;border-radius:3px;border:1px solid transparent;font-size:.875rem}.main_table__j8SHe td>a:not(.main_selected__3kBvq):hover{cursor:pointer;border-bottom:1px solid #ccc;border-right:1px solid #ccc;border-color:#ccc #aaa #aaa #ccc;border-style:solid;border-width:1px;background:#f5f5f5;background:linear-gradient(#e6e6e6,#f5f5f5);box-shadow:0 2px 3px hsla(0,0%,86.3%,.8)}.main_dragTarget__2aNst{cursor:grab}.main_space__1-DPX{background:none;width:10px}.main_hourAnchor__3pKRd,.main_minuteAnchor__3L1AZ{text-align:center}.main_red__2EJT3{color:#b71c1c;box-shadow:inset 0 0 0 1px #b71c1c}.main_red__2EJT3 .main_header__3DmbH,.main_red__2EJT3 a.main_selected__3kBvq{color:#ffebee;background:linear-gradient(#b71c1c,#de2828)}.main_pink__2791I{color:#880e4f;box-shadow:inset 0 0 0 1px #880e4f}.main_pink__2791I .main_header__3DmbH,.main_pink__2791I a.main_selected__3kBvq{color:#fce4ec;background:linear-gradient(#880e4f,#b6136a)}.main_purple__2uZiy{color:#4a148c;box-shadow:inset 0 0 0 1px #4a148c}.main_purple__2uZiy .main_header__3DmbH,.main_purple__2uZiy a.main_selected__3kBvq{color:#f3e5f5;background:linear-gradient(#4a148c,#621ab9)}.main_deep-purple__3vGwH{color:#311b92;box-shadow:inset 0 0 0 1px #311b92}.main_deep-purple__3vGwH .main_header__3DmbH,.main_deep-purple__3vGwH a.main_selected__3kBvq{color:#ede7f6;background:linear-gradient(#311b92,#3f23bd)}.main_indigo__1C2N1{color:#1a237e;box-shadow:inset 0 0 0 1px #1a237e}.main_indigo__1C2N1 .main_header__3DmbH,.main_indigo__1C2N1 a.main_selected__3kBvq{color:#e8eaf6;background:linear-gradient(#1a237e,#232fa8)}.main_blue__1ol4p{color:#0d47a1;box-shadow:inset 0 0 0 1px #0d47a1}.main_blue__1ol4p .main_header__3DmbH,.main_blue__1ol4p a.main_selected__3kBvq{color:#e3f2fd;background:linear-gradient(#0d47a1,#115cd0)}.main_light-blue__1bolP{color:#01579b;box-shadow:inset 0 0 0 1px #01579b}.main_light-blue__1bolP .main_header__3DmbH,.main_light-blue__1bolP a.main_selected__3kBvq{color:#e1f5fe;background:linear-gradient(#01579b,#0173ce)}.main_cyan__3DuBo{color:#006064;box-shadow:inset 0 0 0 1px #006064}.main_cyan__3DuBo .main_header__3DmbH,.main_cyan__3DuBo a.main_selected__3kBvq{color:#e0f7fa;background:linear-gradient(#006064,#009197)}.main_teal__31IFE{color:#004d40;box-shadow:inset 0 0 0 1px #004d40}.main_teal__31IFE .main_header__3DmbH,.main_teal__31IFE a.main_selected__3kBvq{color:#e0f2f1;background:linear-gradient(#004d40,#00806a)}.main_green__1GYSB{color:#1b5e20;box-shadow:inset 0 0 0 1px #1b5e20}.main_green__1GYSB .main_header__3DmbH,.main_green__1GYSB a.main_selected__3kBvq{color:#e8f5e9;background:linear-gradient(#1b5e20,#26862d)}.main_light-green__2-q3C{color:#33691e;box-shadow:inset 0 0 0 1px #33691e}.main_light-green__2-q3C .main_header__3DmbH,.main_light-green__2-q3C a.main_selected__3kBvq{color:#f1f8e9;background:linear-gradient(#33691e,#469129)}.main_lime__QtHWL{color:#827717;box-shadow:inset 0 0 0 1px #827717}.main_lime__QtHWL .main_header__3DmbH,.main_lime__QtHWL a.main_selected__3kBvq{color:#f9fbe7;background:linear-gradient(#827717,#ad9f1f)}.main_yellow__1mv4_{color:#f57f17;box-shadow:inset 0 0 0 1px #f57f17}.main_yellow__1mv4_ .main_header__3DmbH,.main_yellow__1mv4_ a.main_selected__3kBvq{color:#fffde7;background:linear-gradient(#f57f17,#f79a48)}.main_amber__1LnO1{color:#ff6f00;box-shadow:inset 0 0 0 1px #ff6f00}.main_amber__1LnO1 .main_header__3DmbH,.main_amber__1LnO1 a.main_selected__3kBvq{color:#fff8e1;background:linear-gradient(#ff6f00,#ff8c33)}.main_orange__19Dtd{color:#e65100;box-shadow:inset 0 0 0 1px #e65100}.main_orange__19Dtd .main_header__3DmbH,.main_orange__19Dtd a.main_selected__3kBvq{color:#fff3e0;background:linear-gradient(#e65100,#ff6b1a)}.main_deep-orange__1r7FS{color:#bf360c;box-shadow:inset 0 0 0 1px #bf360c}.main_deep-orange__1r7FS .main_header__3DmbH,.main_deep-orange__1r7FS a.main_selected__3kBvq{color:#fbe9e7;background:linear-gradient(#bf360c,#ef440f)}.main_brown__3_i42{color:#3e2723;box-shadow:inset 0 0 0 1px #3e2723}.main_brown__3_i42 .main_header__3DmbH,.main_brown__3_i42 a.main_selected__3kBvq{color:#efebe9;background:linear-gradient(#3e2723,#5f3c35)}.main_blue-grey__2SoYU{color:#263238;box-shadow:inset 0 0 0 1px #263238}.main_blue-grey__2SoYU .main_header__3DmbH,.main_blue-grey__2SoYU a.main_selected__3kBvq{color:#eceff1;background:linear-gradient(#263238,#3b4d56)}.main_grey__26yKi{color:#212121;box-shadow:inset 0 0 0 1px #212121}.main_grey__26yKi .main_header__3DmbH,.main_grey__26yKi a.main_selected__3kBvq{color:#fafafa;background:linear-gradient(#212121,#3b3b3b)}";
  var style = {"container":"main_container__1GGJE","active":"main_active__1rd16","dragging":"main_dragging__1Zr7i","dragTarget":"main_dragTarget__2aNst","table":"main_table__j8SHe","header":"main_header__3DmbH","selected":"main_selected__3kBvq","space":"main_space__1-DPX","hourAnchor":"main_hourAnchor__3pKRd","minuteAnchor":"main_minuteAnchor__3L1AZ","red":"main_red__2EJT3","pink":"main_pink__2791I","purple":"main_purple__2uZiy","deep-purple":"main_deep-purple__3vGwH","indigo":"main_indigo__1C2N1","blue":"main_blue__1ol4p","light-blue":"main_light-blue__1bolP","cyan":"main_cyan__3DuBo","teal":"main_teal__31IFE","green":"main_green__1GYSB","light-green":"main_light-green__2-q3C","lime":"main_lime__QtHWL","yellow":"main_yellow__1mv4_","amber":"main_amber__1LnO1","orange":"main_orange__19Dtd","deep-orange":"main_deep-orange__1r7FS","brown":"main_brown__3_i42","blue-grey":"main_blue-grey__2SoYU","grey":"main_grey__26yKi"};
  styleInject(css_248z);

  var themesMap = {
    dark: style.grey,
    red: style.red,
    pink: style.pink,
    purple: style.purple,
    'deep-purple': style['deep-purple'],
    indigo: style.indigo,
    blue: style.blue,
    'light-blue': style['light-blue'],
    cyan: style.cyan,
    teal: style.teal,
    green: style.green,
    'light-green': style['light-green'],
    lime: style.lime,
    yellow: style.yellow,
    amber: style.amber,
    orange: style.orange,
    'deep-orange': style['deep-orange'],
    brown: style.brown,
    'blue-grey': style['blue-grey'],
  };

  var createHours = function (rowNumber) {
    var colsNumber = 6;

    var cols = '';

    for (var index = 0; index < colsNumber; index++) {
      var hour = rowNumber * colsNumber + index;

      cols += "<td><a class=\"" + (style.hourAnchor) + "\" data-hour=\"" + hour + "\">" + hour + "</a></td>";
    }

    return cols;
  };

  var createMinutes = function (rowNumber) {
    var colsNumber = 3;
    var step = 5;

    var cols = "<td class=\"" + (style.space) + "\"></td>";

    for (var index = 0; index < colsNumber; index++) {
      var minute = String((rowNumber * colsNumber + index) * step).padStart(2, '0');

      cols += "<td><a class=\"" + (style.minuteAnchor) + "\" data-minute=\"" + minute + "\">" + minute + "</a></td>";
    }

    return cols;
  };

  function createStructure(picker) {
    var structure = [
      ("<table class=\"" + (style.table) + "\">"),
      ("<thead><tr class=\"" + (style.dragTarget) + "\">"),
      ("<th colspan=\"6\" class=\"" + (style.header) + "\">" + (LANG[picker.options.lang].hour) + "</th>"),
      ("<th colspan=\"4\" class=\"" + (style.header) + "\">" + (LANG[picker.options.lang].minute) + "</th>"),
      '</tr></thead>',
      '<tbody>',
      '{{body}}',
      '</tbody>',
      '</table>' ];

    var rows = [];

    for (var index = 0; index < 4; index++) {
      var row = "<tr>" + (createHours(index)) + (createMinutes(index)) + "</tr>";

      rows.push(row);
    }

    structure[structure.indexOf('{{body}}')] = rows.join('');

    var classname = [style.container, themesMap[picker.options.theme]].join(' ');
    var container = createElement(['div', { classname: classname }], structure.join(''));

    container.style.zIndex = getMaxZIndex() + 10;
    container.style.visibility = 'hidden';
    document.body.append(container);

    return container;
  }

  function handleDrag(picker) {
    // eslint-disable-next-line prefer-const
    var ref = picker.container;
    var element = ref.element;
    var dragElement = ref.dragElement;
    var lastX = ref.lastX;
    var lastY = ref.lastY;
    var currentX = ref.currentX;
    var currentY = ref.currentY;
    var x = ref.x;
    var y = ref.y;

    var when = {};
    var dragging = function (evt) {
      evt.preventDefault();

      currentX = Number.parseInt(element.style.left, 10) || 0;
      currentY = Number.parseInt(element.style.top, 10) || 0;
      x = currentX + (evt.clientX - lastX);
      y = currentY + (evt.clientY - lastY);

      when.move.call(undefined, { target: element, x: x, y: y });
      lastX = evt.clientX;
      lastY = evt.clientY;
    };
    var stopDragging = function () {
      document.removeEventListener('mousemove', dragging, false);
      document.removeEventListener('mouseup', stopDragging, false);
      when.end.call(undefined, { target: element, x: x, y: y });
    };
    var startDragging = function (evt) {
      if (evt.button !== 0) { return; }

      lastX = evt.clientX;
      lastY = evt.clientY;

      when.start.call({ target: element });
      document.addEventListener('mousemove', dragging, false);
      document.addEventListener('mouseup', stopDragging, false);
    };

    dragElement.addEventListener('mousedown', startDragging, false);

    return {
      when: function (object) {
        when.start = object.start;
        when.move = object.move;
        when.end = object.end;
      },
    };
  }

  /**
   * Based on https://github.com/developit/mitt
   */

  function mitt (all) {
    if ( all === void 0 ) all = new Map();

    return {
      all: all,

      /**
       * Register an event handler for the given type.
       * @param {string|symbol} type Type of event to listen for, or `"*"` for all events
       * @param {Function} handler Function to call in response to given event
       */
      on: function on(type, handler) {
        var handlers = all.get(type);
        var added = handlers && handlers.push(handler);

        if (!added) {
          all.set(type, [handler]);
        }
      },

      /**
       * Remove an event handler for the given type.
       * @param {string|symbol} type Type of event to unregister `handler` from, or `"*"`
       * @param {Function} handler Handler function to remove
       */
      off: function off(type, handler) {
        var handlers = all.get(type);

        if (handlers) {
          handlers.splice(handlers.indexOf(handler), 1);
        }
      },

      /**
       * Invoke all handlers for the given type.
       * If present, `"*"` handlers are invoked after type-matched handlers.
       *
       * Note: Manually firing "*" handlers is not supported.
       *
       * @param {string|symbol} type The event type to invoke
       * @param {Any} [evt] Any value (object is recommended and powerful), passed to each handler
       */
      emit: function emit(type, evt) {
        (all.get(type) || []).slice().map(function (handler) { return handler(evt); });
        (all.get('*') || []).slice().map(function (handler) { return handler(type, evt); });
      },
    };
  }

  /**
   * @param {String|Element} target String or DOM node
   * @param {Object|undefined} initOptions Options
   */
  function base (target, initOptions) {
    var targetElement = isElement(target) ? target : document.querySelector(target);

    assert(isElement(targetElement), "Couldn't find target in DOM");

    var emitter = mitt();
    var options = Object.assign(DEFAULT_OPTIONS, initOptions);
    var picker = {
      options: options,
      target: { element: targetElement, offset: getOffset(targetElement) },
      // this will cache DOM <a> hours (and minutes) array among others
      collection: { hours: [], minutes: [] },
      hour: null,
      minute: null,
      requestAnimationId: null,
      opened: false,
      closeWhen: { hour: false, minute: false },

      container: {
        element: null,
        dragElement: null,
        lastX: null,
        lastY: null,
        currentX: null,
        currentY: null,
        x: null,
        y: null,
        size: { width: null, height: null },
      },
    };

    function initialize() {
      var container = createStructure(picker);
      var offset = getOffset(container);

      container.style.display = 'none';
      container.style.visibility = '';
      picker.container.element = container;
      picker.container.size.width = offset.width;
      picker.container.size.height = offset.height;
      picker.container.dragElement = container.querySelector(("." + (style.dragTarget)));
      picker.collection.hours = container.querySelectorAll(("." + (style.hourAnchor)));
      picker.collection.minutes = container.querySelectorAll(("." + (style.minuteAnchor)));

      var drag = handleDrag(picker);

      drag.when({
        start: function () { return addClass(container, style.dragging); },

        move: function (resp) {
          container.style.left = (resp.x) + "px";
          container.style.top = (resp.y) + "px";
        },

        end: function (resp) {
          removeClass(container, style.dragging);

          if (resp.y < 0) { container.style.top = 0; }
        },
      });

      setListeners();
    }

    function triggerShow(evt) {
      if (picker.opened) { return; }

      evt.preventDefault();
      window.cancelAnimationFrame(picker.requestAnimationId);
      show();
    }

    function show() {
      var hour = picker.hour;
      var minute = picker.minute;
      var collection = picker.collection;
      var containerElement = picker.container.element;
      var containerSize = picker.container.size;
      var targetOffset = picker.target.offset;
      var windowSize = getWindowSize();
      var doesNotFitToTheRight = targetOffset.right + containerSize.width > windowSize.width;

      var ref = doesNotFitToTheRight
        ? [((windowSize.width - (containerSize.width + 20)) + "px"), ((targetOffset.bottom + 5) + "px")]
        : [((targetOffset.right + 5) + "px"), ((targetOffset.top) + "px")];
      var left = ref[0];
      var top = ref[1];

      containerElement.style.left = left;
      containerElement.style.top = top;

      picker.requestAnimationId = fade({ emitter: emitter, element: containerElement });

      removeClass(collection.hours, style.selected);
      removeClass(collection.minutes, style.selected);

      if (hour && minute) {
        var value;

        collection.hours.forEach(function (element) {
          value = getHour(element);

          if (value === hour) {
            addClass(element, style.selected);
          }
        });
        collection.minutes.forEach(function (element) {
          value = getMinute(element);

          if (value === minute) {
            addClass(element, style.selected);
          }
        });
      }

      // one-time fire
      document.addEventListener(
        'mousedown',
        {
          handleEvent: function handleEvent(evt) {
            // click inside Picker
            if (containerElement.contains(evt.target)) { return; }

            var clickingTarget = picker.target.element === evt.target;

            if (!clickingTarget) {
              picker.opened && hide();
              document.removeEventListener(evt.type, this, false);
            }
          },
        },
        false
      );

      picker.opened = true;
      picker.closeWhen.hour = false;
      picker.closeWhen.minute = false;

      // client events
      emitter.emit(EVENT_TYPE.open, { element: picker.target.element });
    }

    function hide() {
      picker.opened = false;
      picker.requestAnimationId = fade({
        emitter: emitter,
        element: picker.container.element,
        time: 800,
        action: 'out',
      });

      // client events
      emitter.emit(EVENT_TYPE.close, { element: picker.container.element });
    }

    function setTarget(newTarget) {
      var newTargetElement = isElement(newTarget) ? newTarget : document.querySelector(newTarget);

      assert(isElement(newTargetElement), "Couldn't find target in DOM");

      picker.target.element.removeEventListener('focus', triggerShow, true);
      picker.target.element.removeEventListener('click', triggerShow, true);
      picker.hour = null;
      picker.minute = null;

      picker.target.element = newTargetElement;
      picker.target.offset = getOffset(newTargetElement);
      setListeners();
    }

    function setListeners() {
      emitter.on(EVENT_TYPE.startFadeIn, function (object) {
        object.target.style.opacity = 0;
        object.target.style.display = 'block';
      });

      emitter.on(EVENT_TYPE.startFadeOut, function (object) {
        object.target.style.opacity = 1;
        object.target.style.display = 'block';
      });

      emitter.on(EVENT_TYPE.endFadeOut, function (object) {
        object.target.style.display = 'none';
      });

      if (FOCUSABLE.test(picker.target.element.nodeName)) {
        picker.target.element.addEventListener('focus', triggerShow, true);
      } else if (CLICKABLE.test(picker.target.element.nodeName)) {
        picker.target.element.addEventListener('click', triggerShow, true);
      }

      picker.collection.hours.forEach(function (anchor) {
        anchor.addEventListener('click', handleAnchorClick);
      });
      picker.collection.minutes.forEach(function (anchor) {
        anchor.addEventListener('click', handleAnchorClick);
      });
    }

    function handleAnchorClick(evt) {
      evt.preventDefault();

      var anchor = evt.target;

      if (hasClass(anchor, style.hourAnchor)) {
        picker.hour = getHour(anchor);
        picker.closeWhen.hour = true;
        removeClass(picker.collection.hours, style.selected);
      } else {
        picker.minute = getMinute(anchor);
        picker.closeWhen.minute = true;
        removeClass(picker.collection.minutes, style.selected);
      }

      addClass(anchor, style.selected);
      picker.closeWhen.hour && picker.closeWhen.minute && hide();

      emitter.emit(EVENT_TYPE.change, {
        element: picker.target.element,
        hour: picker.hour,
        minute: picker.minute,
      });
    }

    return { options: options, show: show, hide: hide, initialize: initialize, picker: picker, emitter: emitter, setTarget: setTarget };
  }

  function entry (target, initOptions) {
    var ref = base(target, initOptions);
    var initialize = ref.initialize;
    var show = ref.show;
    var hide = ref.hide;
    var emitter = ref.emitter;
    var setTarget = ref.setTarget;
    var picker = ref.picker;

    initialize();

    return { show: show, hide: hide, setTarget: setTarget, on: emitter.on, container: picker.container.element };
  }

  return entry;

})));
