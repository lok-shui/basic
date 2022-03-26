
class myVue extends EventTarget {
  constructor(options) {
    super();
    this.$options = options;
    this.compile();
    this.observe(this.$options.data);
  }

  // 数据劫持
  observe(data) {
    let keys = Object.keys(data);
    // 遍历循环data数据，给每个属性增加数据劫持
    keys.forEach(key => {
      this.defineReact(data, key, data[key]);
    })
  }

  // 利用defineProperty 进行数据劫持
  defineReact(data, key, value) {
    let _this = this;
    Object.defineProperty(data, key, {
      configurable: true,
      enumerable: true,
      get() {
        return value;
      },
      set(newValue) {
        // 监听到数据变化， 触发事件
        let event = new CustomEvent(key, {
          detail: newValue
        });
        _this.dispatchEvent(event);
        value = newValue;
      }
    });
  }

  // 获取元素节点，渲染视图
  compile() {
    let el = document.querySelector(this.$options.el);
    this.compileNode(el);
  }
  // 渲染视图
  compileNode(el) {
    let childNodes = el.childNodes;
    // 遍历循环所有元素节点
    childNodes.forEach(node => {
      if (node.nodeType === 1) {
        // 如果是标签 需要跟进元素attribute 属性区分v-html 和 v-model
        let attrs = node.attributes;
        [...attrs].forEach(attr => {
          let attrName = attr.name;
          let attrValue = attr.value;
          if (attrName.indexOf("v-") === 0) {
            attrName = attrName.substr(2);
            // 如果是 html 直接替换为将节点的innerHTML替换成data数据
            if (attrName === "html") {
              node.innerHTML = this.$options.data[attrValue];
            } else if (attrName === "model") {
              // 如果是 model 需要将input的value值替换成data数据
              node.value = this.$options.data[attrValue];

              // 监听input数据变化，改变data值
              node.addEventListener("input", e => {
                this.$options.data[attrValue] = e.target.value;
              })
            }
          }
        })
        if (node.childNodes.length > 0) {
          this.compileNode(node);
        }
      } else if (node.nodeType === 3) {
        // 如果是文本节点， 直接利用正则匹配到文本节点的内容，替换成data的内容
        let reg = /\{\{\s*(\S+)\s*\}\}/g;
        let textContent = node.textContent;
        if (reg.test(textContent)) {
          let $1 = RegExp.$1;
          node.textContent = node.textContent.replace(reg, this.$options.data[$1]);
          // 监听数据变化，重新渲染视图
          this.addEventListener($1, e => {
            let oldValue = this.$options.data[$1];
            let reg = new RegExp(oldValue);
            node.textContent = node.textContent.replace(reg, e.detail);
          })
        }
      }
    })
  }
}