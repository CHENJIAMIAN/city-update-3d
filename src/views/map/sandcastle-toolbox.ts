type Option = { text: string; onselect: () => void; value?: string }[];

let defaultAction: () => void;
// 官网sandcastle-header.js 魔改而来,用来方便地添加调试按钮,菜单
export default {
    // 添加一个checkbox
    addToggleButton: function (
        text: string,
        checked: boolean,
        onchange: (isChecked: boolean) => void,
        toolbarID: string
    ) {
        let input = document.createElement('input');
        input.checked = checked;
        input.type = 'checkbox';
        input.style.pointerEvents = 'none';
        let label = document.createElement('label');
        label.appendChild(input);
        label.appendChild(document.createTextNode(text));
        label.style.pointerEvents = 'none';
        let button = document.createElement('button');
        button.type = 'button';
        button.className = 'cesium-button';
        button.appendChild(label);

        button.onclick = function () {
            input.checked = !input.checked;
            onchange(input.checked);
        };

        document.getElementById(toolbarID || 'toolbar')?.appendChild(button);
    },
    // 添加一个button
    addToolbarButton: function (
        text: string,
        onclick: () => void,
        toolbarID: string
    ) {
        let button = document.createElement('button');
        button.type = 'button';
        button.className = 'cesium-button';
        button.onclick = function () {
            onclick();
        };
        button.textContent = text;
        document.getElementById(toolbarID || 'toolbar')?.appendChild(button);
    },
    /* 添加下拉菜单
  Sandcastle.addToolbarMenu([
{
  text: "Color By Height",
  onselect: function () {
    colorByHeight();
  },
},
{
  text: "Color By Latitude",
  onselect: function () {
    colorByLatitude();
  },
},
{
  text: "Color By Distance",
  onselect: function () {
    colorByDistance();
  },
},
{
  text: "Color By Name Regex",
  onselect: function () {
    colorByStringRegex();
  },
},
{
  text: "Hide By Height",
  onselect: function () {
    hideByHeight();
  },
},
]);
   */
    addToolbarMenu: function (options: Option, toolbarID: string) {
        let menu = document.createElement('select');
        menu.className = 'cesium-button';
        menu.onchange = function () {
            let item = options[menu.selectedIndex];
            if (item && typeof item.onselect === 'function') {
                item.onselect();
            }
        };
        document.getElementById(toolbarID || 'toolbar')?.appendChild(menu);

        if (!defaultAction && typeof options[0].onselect === 'function') {
            defaultAction = options[0].onselect;
        }

        for (let i = 0, len = options.length; i < len; ++i) {
            let option = document.createElement('option');
            option.textContent = options[i].text;
            option.value = options[i].value || '';
            menu.appendChild(option);
        }
    },
    // 添加一个默认button,它在调用executeDeault()时被调用一遍监听函数,而不用手动点击按钮时
    addDefaultToolbarButton: function (
        text: string,
        onclick: () => void,
        toolbarID: string
    ) {
        this.addToolbarButton(text, onclick, toolbarID);
        defaultAction = onclick;
    },
    // 添加一个默认下拉菜单,它在调用executeDeault()时被调用一遍第一个选项被选中的监听函数,而不用手动选择时才执行
    addDefaultToolbarMenu: function (options: Option, toolbarID: string) {
        this.addToolbarMenu(options, toolbarID);
        defaultAction = options[0].onselect;
    },
    // 执行默认DefaultToolbarButton 或 DefaultToolbarMenu
    executeDeault: function () {
        if (defaultAction) {
            defaultAction();
            defaultAction = () => {};
        }
    },
};
