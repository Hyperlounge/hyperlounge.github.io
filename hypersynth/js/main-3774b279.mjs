class Model extends EventTarget{constructor(e={}){super(),this._previousAttributes={},this._attributes={...this.constructor.defaults,...e}}set(t,e=!1){this._previousAttributes={...this._attributes},Object.keys(t).forEach(e=>{this._attributes[e]instanceof Model?this._attributes[e].set(t[e]):this._attributes[e]=t[e]}),e||this.dispatchEvent(new Event("change")),e||Object.keys(this._attributes).forEach(e=>{var t=this._previousAttributes[e],o=this._attributes[e];t!==o&&((e=new Event("change:"+e)).data={previousValue:t,newValue:o},this.dispatchEvent(e))})}get(e){return this._attributes[e]}reset(){this._previousAttributes={},this._attributes={...this.constructor.defaults}}hasChanged(e,t){var o=this._previousAttributes[e],e=this._attributes[e],i=e!==o;return t&&i&&t(e,o),i}set attributes(e){this._attributes=e}get attributes(){let o={};return Object.keys(this._attributes).forEach(e=>{var t=this._attributes[e];t instanceof Array?o[e]=t.map(e=>e instanceof Model?e.attributes:e):o[e]=t instanceof Model?t.attributes:t}),o}get previousAttributes(){return{...this._previousAttributes}}static defaults={}}class AudioModule extends EventTarget{constructor(e,t,o,i){super(),this._audioContext=e,this._eventBus=t,this._globalPatch=o,this._globalPatch.addEventListener("change",e=>this._onGlobalPatchChange(e)),this._options=i,this._patch=new Model(this._initialPatch),this._patch.addEventListener("change",e=>{this._onPatchChange(e),this.dispatchEvent(new CustomEvent("patch-change"))}),this._initialState&&(this._state=new Model(this._initialState),this._state.addEventListener("change",e=>this.dispatchEvent(new CustomEvent("state-change")))),this._initialise()}_initialise(){}_onPatchChange(e){}_onGlobalPatchChange(e){}get _initialState(){}get _initialPatch(){return{}}get _minimumTimeConstant(){return.005}get _now(){return this._audioContext.currentTime}setParam(e,t){this._patch.set({[e]:t})}getParam(e){return this._patch.get(e)}paramChanged(e,t){return this._patch.hasChanged(e,t)}get patch(){return this._patch.attributes}set patch(e){this._patch.set(e)}get globalPatch(){return this._globalPatch.attributes}}class NoteChangeEvent extends CustomEvent{constructor(e,t,o,i){super(NoteChangeEvent.type,{detail:{newNoteNumber:e,oldNoteNumber:t,voiceNumber:o,velocity:i}})}static type="note-change"}class LFOModule extends AudioModule{_initialise(){var e=this._audioContext;this._modWheelValue=0,this._level=new GainNode(e,{gain:0}),this._modWheelNode=new ConstantSourceNode(e,{offset:0}),this._modWheelNode.start(),this._modWheelNode.connect(this._level.gain),this._fixedNode=new ConstantSourceNode(e,{offset:1}),this._fixedNode.start(),this._fixedNode.connect(this._level.gain),this._noiseNode=new GainNode(e,{gain:1}),this._oscillatorNode=new OscillatorNode(e),this._oscillatorNode.start(),this._oscillatorNode.connect(this._level),this._sampleAndHold=new ConstantSourceNode(e),this._sampleAndHold.start(),this._eventBus.addEventListener("modwheel",e=>this._onModWheelChange(e)),this._update(),this._eventBus.addEventListener(NoteChangeEvent.type,e=>this._onNoteChange(e))}get _initialPatch(){return{waveform:"sine",frequency:10,fixedAmount:0,modWheelAmount:0,delay:0,expression:0}}_onNoteChange(e){var{newNoteNumber:e,velocity:t}=e.detail,{delay:o,fixedAmount:i,waveform:s,expression:a}=this._patch.attributes,a=o*(1-a*t/127);0!==o&&void 0!==e&&(this._fixedNode.offset.cancelScheduledValues(this._now),this._fixedNode.offset.setTargetAtTime(0,this._now,0),t=i*("inverse-sawtooth"===s?-1:1),this._fixedNode.offset.linearRampToValueAtTime(0,this._now+a/2),this._fixedNode.offset.linearRampToValueAtTime(t,this._now+2*a))}_onModWheelChange(e){this._modWheelValue=e.detail.value,this._setModWheelOffset()}_setModWheelOffset(){let e=this._patch.get("modWheelAmount")*this._modWheelValue/10;"inverse-sawtooth"===this._patch.get("waveform")&&(e=-e),this._modWheelNode.offset.setTargetAtTime(e,this._now,this._minimumTimeConstant)}_onPatchChange(e){super._onPatchChange(e),this._update()}_update(){var e=this._patch.get("frequency");let t=this._patch.get("waveform");var o=this._patch.previousAttributes.waveform;let i=1;"sample-hold"===t?(void 0===this._sampleAndHoldTimer&&("noise"===o?this._noiseNode.disconnect(this._level):"sample-hold"!==o&&this._oscillatorNode.disconnect(this._level),this._sampleAndHold.connect(this._level)),(this._patch.hasChanged("frequency")||this._patch.hasChanged("waveform"))&&(void 0!==this._sampleAndHoldTimer&&clearInterval(this._sampleAndHoldTimer),this._sampleAndHoldTimer=setInterval(()=>{this._sampleAndHold.offset.setValueAtTime(2*Math.random()-1,this._now)},1e3/e))):(void 0!==this._sampleAndHoldTimer&&(clearInterval(this._sampleAndHoldTimer),delete this._sampleAndHoldTimer),"noise"===t?("sample-hold"===o?this._sampleAndHold.disconnect(this._level):"noise"!==o&&this._oscillatorNode.disconnect(this._level),this._noiseNode.connect(this._level)):("sample-hold"===o?this._sampleAndHold.disconnect(this._level):"noise"===o&&this._noiseNode.disconnect(this._level),this._oscillatorNode.connect(this._level),"inverse-sawtooth"===t&&(t="sawtooth",i=-1),this._oscillatorNode.type=t,this._oscillatorNode.frequency.setTargetAtTime(e,this._now,this._minimumTimeConstant)));o=this._patch.get("fixedAmount")*i;this._fixedNode.offset.cancelScheduledValues(this._now).setTargetAtTime(o,this._now,this._minimumTimeConstant),this._setModWheelOffset()}get lfoOut(){return this._level}get noiseIn(){return this._noiseNode}}class MidiEvent extends CustomEvent{constructor(e,t,o){super(MidiEvent.type,{detail:{statusByte:e,dataByte1:t,dataByte2:o}})}static type="midi-message";static NOTE_OFF=128;static NOTE_ON=144;static PITCH_BEND=224;static CONTROLLER=176;static SUSTAIN_PEDAL=64;static MOD_WHEEL=1}class PolyAudioParam{constructor(e,t){this.name=e,this.polyNode=t}set value(t){this._value=t,this.polyNode.nodes.forEach(e=>e[this.name].value=t)}get value(){return void 0===this._value?this.polyNode.nodes[0][this.name].value:this._value}setValueAtTime(t,o){this.polyNode.nodes.forEach(e=>e[this.name].setValueAtTime(t,o))}linearRampToValueAtTime(t,o){this.polyNode.nodes.forEach(e=>e[this.name].linearRampToValueAtTime(t,o))}exponentialRampToValueAtTime(t,o){this.polyNode.nodes.forEach(e=>e[this.name].exponentialRampToValueAtTime(t,o))}setTargetAtTime(t,o,i){this.polyNode.nodes.forEach(e=>e[this.name].setTargetAtTime(t,o,i))}setValueCurveAtTime(t,o,i){this.polyNode.nodes.forEach(e=>e[this.name].setValueCurveAtTime(t,o,i))}cancelScheduledValues(t){this.polyNode.nodes.forEach(e=>e[this.name].cancelScheduledValues(t))}cancelAndHoldAtTime(t){this.polyNode.nodes.forEach(e=>e[this.name].cancelAndHoldAtTime(t))}polyConnectFrom(e){this.polyNode.addConnection({paramName:this.name,type:"polyFrom",target:e})}fanOutConnectFrom(e){this.polyNode.addConnection({paramName:this.name,type:"fanOutFrom",target:e})}}class PolyAudioNode{constructor(e,t){this.context=e,this.options=t,this.polyProperties={},this.polyParams={},this.connections=[],this.nodes=[this.createNode()]}setPolyProperty(t,o){this.polyProperties[t]=o,this.nodes.forEach(e=>e[t]=o)}getPolyProperty(e){return this.polyProperties[e]}getPolyParam(e){return this.polyParams[e]||(this.polyParams[e]=new PolyAudioParam(e,this)),this.polyParams[e]}createNode(){let t={};Object.keys(this.polyParams).forEach(e=>{t[e]=this.polyParams[e].value});var e=new this._AudioNodeClass(this.context,{...this.options,...this.polyProperties,...t});return e instanceof AudioScheduledSourceNode&&e.start(),e}destroyNode(e){e instanceof AudioScheduledSourceNode&&e.stop(),e.disconnect()}set totalVoices(o){for(;o>this.nodes.length;)this.nodes.push(this.createNode());for(;o<this.nodes.length;)this.destroyNode(this.nodes.pop());this.connections.forEach(e=>{var{type:e,target:t}=e;switch(e){case"polyTo":t instanceof PolyAudioNode?t.totalVoices=o:t.polyNode.totalVoices=o;break;case"polyFrom":t.totalVoices=o}}),this.refreshConnections()}addConnection(e){this.connections.push(e),this.refreshConnections()}refreshConnections(){this.connections.forEach(e=>{let{type:o,target:i,paramName:s}=e;this.nodes.forEach((e,t)=>{switch(o){case"polyTo":e.connect(i instanceof PolyAudioNode?i.nodes[t]:i.polyNode.nodes[t][i.name]);break;case"polyFrom":i.nodes[t].connect(s?e[s]:e);break;case"fanInTo":e.connect(i);break;case"fanOutFrom":i.connect(s?e[s]:e)}})})}polyConnectTo(e){this.addConnection({type:"polyTo",target:e})}polyConnectFrom(e){this.addConnection({type:"polyFrom",target:e})}fanInConnectTo(e){this.addConnection({type:"fanInTo",target:e})}fanOutConnectFrom(e){this.addConnection({type:"fanOutFrom",target:e})}get _AudioNodeClass(){return AudioNode}}class PolyConstantSource extends PolyAudioNode{get _AudioNodeClass(){return ConstantSourceNode}get offset(){return this.getPolyParam("offset")}}class VoiceAllocatorModule extends AudioModule{_initialise(){super._initialise(),this._pitches=new PolyConstantSource(this._audioContext,{}),this._initializeVoices(),this._eventBus.addEventListener(MidiEvent.type,e=>this._onMIDIMessage(e))}get _initialPatch(){return{numberOfVoices:1,glideTime:0}}_onPatchChange(e){super._onPatchChange(e),this._patch.hasChanged("numberOfVoices",()=>this._initializeVoices())}_initializeVoices(){var e=this.patch.numberOfVoices,t=Math.max(e,1);this._globalPatch.set({totalVoices:t,legato:0===e}),this._usedVoices=[],this._freeVoices=Array(t).fill().map((e,t)=>({voiceNumber:t,note:void 0})),this._pitches.totalVoices=t,this._downNotes=[]}_onMIDIMessage(e){var{statusByte:e,dataByte1:t,dataByte2:o}=e.detail;128<=e&&e<=143?this._onKeyUp(t,o):144<=e&&e<=159&&this._onKeyDown(t,o)}_onKeyDown(o,e){this._downNotes.unshift(o);let i,t,s=!1;if(this._freeVoices.length){let t=this._freeVoices.find(e=>e.note===o);t?(i=t.voiceNumber,this._freeVoices=this._freeVoices.filter(e=>e!==t)):i=this._freeVoices.shift().voiceNumber,this._usedVoices.push({voiceNumber:i,note:o})}else{var a=this._usedVoices.shift();i=a.voiceNumber,t=a.note,this._usedVoices.push({voiceNumber:i,note:o}),s=!0}this._eventBus.dispatchEvent(new NoteChangeEvent(o,t,i,e)),this._setPitch(i,o,s)}_onKeyUp(o,e){let i;this._downNotes=this._downNotes.filter(e=>e!==o);var s=this._usedVoices.find(e=>e.note===o);if(s){let t=s.voiceNumber;1===this.globalPatch.totalVoices&&this._downNotes.length?(i=this._downNotes[0],s.note=i):(this._usedVoices=this._usedVoices.filter(e=>e.voiceNumber!==t),this._freeVoices.push({voiceNumber:t,note:o})),this._eventBus.dispatchEvent(new NoteChangeEvent(i,o,t,e)),i&&this._setPitch(t,i,!0)}}_setPitch(e,t,o=!1){var t=100*(t-60),i=this._patch.get("glideType"),i="always"===i||"legato"===i&&o?this._patch.get("glideTime"):0;this._pitches.nodes[e].offset.setTargetAtTime(t,this._now,i)}get C4Offset(){return this._pitches}}let types={NUMBER:"number",STRING:"string",JSON:"json",BOOL:"bool",DIMENSION:"dimension",STYLE:"style"};function attributesToObject(t){if(t instanceof NamedNodeMap){var o={};for(let e=0;e<t.length;e++){var i=t.item(e);o[i.name.toLowerCase()]={name:i.name,value:i.value}}return o}return t}class PropType{constructor(e){this._type=e,this._required=!1,this._observed=!1,this._comment="",this._defaultValue=void 0,this._attrName="",e===types.STRING&&(this._lookup=void 0,this.lookup=e=>(this._lookup=Object.values(e),this._caseSensitive=!1,Object.defineProperty(this,"caseSensitive",{get(){return this._caseSensitive=!0,this}}),this),this.regExp=e=>(this._regExp=e,this)),e===types.NUMBER&&(this._minValue=void 0,this._maxValue=void 0,this.min=e=>(this._minValue=e,this),this.max=e=>(this._maxValue=e,this))}get required(){return this._required=!0,this}get observed(){return this._observed=!0,this}comment(e){return this._comment=e,this}default(e){return this._defaultValue=e,this}attrName(e){return this._attrName=e,this}_setAttrNameFromPropName(e,t){this._attrName||(this._attrName=(t?e:e.replace(/([A-Z])/g,"-$1")).toLowerCase())}}class PropTypes{static ALLOW_HYPHENS_IN_ATTRIBUTE_NAMES="_allowHyphensInAttributeNames";static get number(){return new PropType(types.NUMBER)}static get string(){return new PropType(types.STRING)}static get bool(){return new PropType(types.BOOL)}static get dimension(){return new PropType(types.DIMENSION)}static get style(){return new PropType(types.STYLE)}static get json(){return new PropType(types.JSON)}static getDefaults(o){let i={};return Object.keys(o).map(e=>{var t;e!==this.ALLOW_HYPHENS_IN_ATTRIBUTE_NAMES&&void 0!==(t=o[e])._defaultValue&&(i[e]=t._defaultValue)}),i}static getObserved(o){let i=[],s=!1===o._allowHyphensInAttributeNames;return Object.keys(o).map(e=>{var t;e!==this.ALLOW_HYPHENS_IN_ATTRIBUTE_NAMES&&((t=o[e])._setAttrNameFromPropName(e,s),t._observed)&&i.push(t._attrName)}),i}static propTypesToDoc(i){let s=[],a=!1,n=!1===i._allowHyphensInAttributeNames;return Object.keys(i).forEach(e=>{var t,o;e!==this.ALLOW_HYPHENS_IN_ATTRIBUTE_NAMES&&((t=i[e])._setAttrNameFromPropName(e,n),""!==t._comment&&(a=!0),s.push(`| ${[`<nobr>${t._attrName}</nobr>`,t._type,(e=t,o=[],e._type===types.NUMBER?(void 0!==e._minValue&&o.push("min: "+e._minValue),void 0!==e._maxValue&&o.push("max: "+e._maxValue)):e._type===types.STRING?(e._lookup&&o.push("one of: "+e._lookup.map(e=>`"${e}"`).join(", ")+(e._caseSensitive?" (case sensitive)":"")),e._regExp&&o.push(`conforms to regExp: <nobr>\`${e._regExp.toString()}\`</nobr>`)):e._type===types.JSON?o.push("a valid JSON string"):e._type===types.STYLE?o.push("valid inline css styles"):e._type===types.DIMENSION&&o.push('a number with optional "px" or "%" suffix, or "content"'),o.join(", ")),(e=t,void 0===e._defaultValue?"":e._type===types.JSON?`'${JSON.stringify(e._defaultValue)}'`:e._type===types.NUMBER||e._type===types.BOOL?e._defaultValue:`"${e._defaultValue}"`),t._required?"yes":"",t._observed?"yes":"",t._comment.replace(/\n/g,"<br/>")].join(" | ")} |`))}),(s=a?s:s.map(e=>e.replace(/\| +\|$/,"|"))).unshift("| --- | --- | --- | --- | --- | --- |"+(a?" --- |":"")),s.unshift("| Attribute | Type | Valid Values | Default | Reqrd | Obsvd |"+(a?" Comment |":"")),s.join("\n").replace(/_/g,"\\_")}static attributesToProps(e,t){var o=e.attributes;let i=e.constructor.propTypes,n={},s=[],a=!1===i._allowHyphensInAttributeNames,r=(Object.keys(i).forEach(e=>{var t;e!==this.ALLOW_HYPHENS_IN_ATTRIBUTE_NAMES&&((t=i[e])._setAttrNameFromPropName(e,a),n[t._attrName]={name:e,propType:t},t._required)&&s.push(e)}),{}),l=attributesToObject(o),h="Location: "+(e.id?"id="+e.id:e.outerHTML);return Object.keys(l).filter(e=>!t||e===t).map(e=>{var{name:o,value:t}=l[e];let i;if(void 0===n[e])throw new Error(`Unknown attribute "${o}". `+h);var s=n[e].propType;switch(s._type){case types.BOOL:if("boolean"==typeof t)i=t;else{var a=t.toLowerCase();if(""!==a&&"true"!==a&&"false"!==a)throw new Error(`Attribute "${o}" must be either "true" or "false". `+h);i="false"!==a}break;case types.DIMENSION:if(!/^(-?\d+(\.\d+)?(px|%)?|content)$/.test(t))throw new Error(`Attribute "${o}" must be a number with optional "px" or "%" suffix, or "content". `+h);i=t.replace(/([-\d.]+)(px|)$/,"$1px");break;case types.STRING:if(i=t,s._required&&!i)throw new Error(`Attribute "${o}" must be one of ${s._lookup.join("|")}. `+h);if(void 0!==s._lookup){let e,t;if(!(t=s._caseSensitive?(e=i,s._lookup):(e=i.toLowerCase(),s._lookup.map(e=>e.toLowerCase()))).includes(e))throw new Error(`Attribute "${o}" must be one of ${s._lookup.join("|")}. `+h);i=e}if(void 0===s._regExp||s._regExp.test(i))break;throw new Error(`Attribute "${o}" must conform to reg. exp. "${s._regExp.toString()}". `+h);case types.NUMBER:if(i=parseFloat(t),isNaN(i))throw new Error(`Attribute "${o}" must be a valid number. `+h);if(void 0!==s._minValue&&i<s._minValue)throw new Error(`Attribute "${o}" must not be less than ${s._minValue}. `+h);if(void 0!==s._maxValue&&i>s._maxValue)throw new Error(`Attribute "${o}" must not be greater than ${s._maxValue}. `+h);break;case types.STYLE:if(i=t.replace(/^\s*(.*?);?\s*$/,"$1;"),/^([a-zA-Z\-\s]+:[a-zA-Z0-9\-.\s#%\(\)\+,']*;)+$/.test(i))break;throw new Error(`Attribute "${o}" must be a valid inline style declaration. `+h);case types.JSON:try{i=JSON.parse(t)}catch(e){throw new Error(`Attribute "${o}" must be a valid JSON string. `+h)}}r[n[e].name]=i}),t||s.forEach(e=>{if(void 0===r[e])throw new Error(`Attribute "${e.replace(/([A-Z])/g,"-$1").toLowerCase()}" is required. `+h)}),{...t?{}:PropTypes.getDefaults(i),...r}}}function addTwiddling(l){let h=()=>{},d=(e,t)=>{},c=()=>{},u=()=>{},p=!1;return l.addEventListener("dblclick",e=>{u()}),l.addEventListener("mousedown",e=>{e.preventDefault();let o=e.pageX,i=e.pageY;var t=l.getBoundingClientRect(),s=e.clientX-t.left,e=e.clientY-t.top;h(s,e);let a=e=>{var t=e.pageX-o,e=e.pageY-i;d(t,e)},n=e=>{document.body.removeEventListener("mousemove",a),document.body.removeEventListener("mouseup",n),document.body.removeEventListener("mouseleave",n),c()};document.body.addEventListener("mousemove",a),document.body.addEventListener("mouseup",n),document.body.addEventListener("mouseleave",n)}),l.addEventListener("touchstart",e=>{if(e.preventDefault(),u){if(p)return p=!1,void u();p=!0,setTimeout(()=>{p=!1},500)}e=e.targetTouches[0];let o=e.identifier,i=e.pageX,s=e.pageY;var t=l.getBoundingClientRect(),a=e.clientX-t.left,e=e.clientY-t.top;h(a,e);let n=e=>{var e=Array.from(e.touches).find(e=>e.identifier===o),t=e.pageX-i,e=e.pageY-s;d(t,e)},r=e=>{Array.from(e.changedTouches).find(e=>e.identifier===o)&&(document.body.removeEventListener("touchmove",n),document.body.removeEventListener("touchend",r),document.body.removeEventListener("touchcancel",r),c())};document.body.addEventListener("touchmove",n),document.body.addEventListener("touchend",r),document.body.addEventListener("touchcancel",r)}),{onStart(e){return h=e,this},onTwiddle(e){return d=e,this},onEnd(e){return c=e,this},onDoubleTap(e){return u=e,this}}}let themeProps=null;function getThemeProps(e){if(!themeProps){let t=getComputedStyle(document.body);themeProps={},["bright-color","normal-color","dark-color","panel-bg-color","panel-text-color","help-bg-color","help-text-color","help-outline-color"].forEach(e=>{themeProps[e]=t.getPropertyValue("--theme-"+e)})}return e?themeProps[e]:{...themeProps}}let KEYBOARD_SVG='<svg width="100%" height="100%" viewBox="0 0 182 114" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"><rect x="0" y="0" width="181.417" height="113.386" style="fill:transparent;"/><path d="M31.181,0l-15.388,0l0,67.019c0,2.123 1.724,3.847 3.847,3.847l7.694,0c2.123,0 3.847,-1.724 3.847,-3.847l0,-67.019Z"/><path d="M61.874,0l-15.388,0l0,67.019c0,2.123 1.724,3.847 3.847,3.847l7.694,0c2.123,0 3.847,-1.724 3.847,-3.847l0,-67.019Z"/><path d="M107.431,0l-15.388,0l0,67.019c0,2.123 1.724,3.847 3.847,3.847l7.694,0c2.123,0 3.847,-1.724 3.847,-3.847l0,-67.019Z"/><path d="M137.278,0l-15.388,0l-0,67.019c-0,2.123 1.724,3.847 3.847,3.847l7.694,0c2.123,0 3.847,-1.724 3.847,-3.847l-0,-67.019Z"/><path d="M167.154,0l-15.388,0l0,67.019c0,2.123 1.724,3.847 3.847,3.847l7.694,0c2.123,0 3.847,-1.724 3.847,-3.847l0,-67.019Z"/></svg>',MIDDLE_C=60,isEbony=e=>[1,3,6,8,10].includes(e%12);class KeyboardAdjuster extends HTMLElement{static propTypes={id:PropTypes.string,class:PropTypes.string,style:PropTypes.string,minNote:PropTypes.number.default(21),maxNote:PropTypes.number.default(108),bottomNote:PropTypes.number.default(36).observed,topNote:PropTypes.number.default(96).observed,middleCColor:PropTypes.string.default(getThemeProps("normal-color")),dataModule:PropTypes.string,dataControl:PropTypes.string};static template=e=>`
<style>
    :host {
        position: relative;
    }
    .keyboard-adjuster {
        position: absolute;
        width: 100%;
        height: 100%;
    }
    
    .background {
        position: absolute;
        left: ${50/e.whiteNotes.length}%;
        right: ${100/e.whiteNotes.length}%;
        height: 100%;
        background-image: url('data:image/svg+xml,${encodeURI(KEYBOARD_SVG)}');
        background-repeat: repeat-x;
        background-size: ${700/(e.whiteNotes.length-1.5)}% 100%;
        background-position-x: right;
    }
    
    .middle-c {
        position: absolute;
        left: ${e.whiteNotes.indexOf(MIDDLE_C)/e.whiteNotes.length*100}%;
        width: ${100/e.whiteNotes.length}%;
        height: 100%;
        background-color: ${e.middleCColor};
    }
    
    .mask {
        position: absolute;
        height: 100%;;
        background-color: #333333;
        opacity: 0.33;
    }
    
    .mask.low-mask {
        left: 0;
    }
    
    .mask.high-mask {
        right: 0;
    }
    
</style>
<div class="keyboard-adjuster">
    <div class="middle-c"></div>
    <div class="background"></div>
    <div class="mask low-mask"></div>
    <div class="mask high-mask"></div>
</div>
    `;constructor(){super()}connectedCallback(){this._root=this.attachShadow({mode:"open"}),this._props=PropTypes.attributesToProps(this),this._title=this.innerHTML,this._whiteNotes=[];for(let e=this._props.minNote;e<=this._props.maxNote;e++)isEbony(e)||this._whiteNotes.push(e);this._initialValue=this._data.value,this._root.innerHTML=KeyboardAdjuster.template(this._data),this._updateView(),this._addControlListeners()}attributeChangedCallback(e,t,o){this._root&&(this._props[e]=PropTypes.attributesToProps(this,e),this._updateView())}get _data(){return{...this._props,title:this._title,whiteNotes:this._whiteNotes}}_updateView(){var e=this._root.querySelector(".low-mask"),t=this._root.querySelector(".high-mask"),o=this._data.whiteNotes;e.style.width=o.indexOf(this._props.bottomNote)/o.length*100+"%",t.style.left=(o.indexOf(this._props.topNote)+1)/o.length*100+"%"}_addControlListeners(){let s=this._root.querySelector(".keyboard-adjuster"),a=this._data.whiteNotes,n,r,l,h;addTwiddling(s).onStart((e,t)=>{n=a.indexOf(this._props.bottomNote),r=a.indexOf(this._props.topNote),h=s.offsetWidth;var o=Math.max(h/10,h*n/a.length),i=Math.min(9*h/10,h*r/a.length);l=e<=o?"bottom":i<=e?"top":"transpose"}).onTwiddle(e=>{let t=Math.round(a.length*e/h);var e=this.bottomNote,o=this.topNote;switch(l){case"bottom":t=Math.max(t,-n),t=Math.min(t,r-n-14),this.bottomNote=a[n+t];break;case"top":t=Math.min(t,a.length-1-r),t=Math.max(t,-(r-n-14)),this.topNote=a[r+t];break;case"transpose":t=Math.max(t,-n),t=Math.min(t,a.length-1-r),this.bottomNote=a[n+t],this.topNote=a[r+t]}this.bottomNote===e&&this.topNote===o||this._dispatchChangeEvent()})}_dispatchChangeEvent(){var e=new CustomEvent("input");this.dispatchEvent(e)}get bottomNote(){return this._props.bottomNote}set bottomNote(e){this._props.bottomNote=Number(e),this._updateView()}get topNote(){return this._props.topNote}set topNote(e){this._props.topNote=Number(e),this._updateView()}}customElements.define("keyboard-adjuster",KeyboardAdjuster);class AbstractComponent extends HTMLElement{static propTypes={id:PropTypes.string,class:PropTypes.string,style:PropTypes.string,moduleId:PropTypes.string,parameterName:PropTypes.string,dataModule:PropTypes.string,dataControl:PropTypes.string};constructor(){super()}connectedCallback(){var e;this._root=this.attachShadow({mode:"open"}),this._props=PropTypes.attributesToProps(this),this._props.moduleId&&this._props.parameterName&&(e=new CustomEvent("register-control",{bubbles:!0,detail:{moduleId:this._props.moduleId,parameterName:this._props.parameterName}}),this.dispatchEvent(e))}attributeChangedCallback(e,t,o){this._root&&(this._props[e]=PropTypes.attributesToProps(this,e))}dispatchChangeEvent(){var e=new CustomEvent("change");this.dispatchEvent(e)}get value(){return null}set value(e){}static linearToLog(t,o){return e=>(Math.pow(2,10*Number(e)/t)-1)*o/1023}static logToLinear(t,o){return e=>Math.log2(1023*Number(e)/t+1)*o/10}static linearToLogRange(t,e,o){let i=Math.log2(o),s=Math.log2(e);return e=>{e=s+Number(e)/t*(i-s);return Math.pow(2,e)}}static logRangeToLinear(e,t,o){let i=Math.log2(t),s=Math.log2(e);return e=>{e=Math.log2(Number(e));return o*(e-s)/(i-s)}}}class CycleSwitch extends AbstractComponent{static propTypes={...AbstractComponent.propTypes,capColor:PropTypes.string.default(getThemeProps("normal-color")).observed,title:PropTypes.string.default("Title").observed,format:PropTypes.string.lookup(["vertical","horizontal"]).default("vertical"),numeric:PropTypes.bool.default(!1)};static template=e=>`
<style>
    .cycle-switch {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-items: center;
        position: relative;
    }
    .cycle-switch.horizontal {
        flex-direction: row;
        gap: 0.5em;
    }
    .title {
        text-align: center;
        margin-bottom: 0.2em;
        color: ${e.foregroundColor};
    }
    .title:empty {
        display: none;
    }
    .switch {
        position: relative;
        box-sizing: border-box;
        width: 70px;
        text-align: center;
        border: 4px solid black;
        border-width: 1px 6px 1px 6px;
        border-radius: 6px;
        font-weight: bold;
        color: black;
        padding: 3px 2px;
        background-image: linear-gradient(
            rgba(0,0,0,0.5), 
            rgba(0,0,0,0.3) 15%, 
            rgba(200,200,200,0.2) 16%,
            rgba(200,200,200,0.3) 26%,
            rgba(0,0,0,0.2) 27%,
            rgba(0,0,0,0) 90%,
            rgba(0,0,0,0.4)
        );
        background-color: ${e.capColor};
        margin-bottom: 0.55em;
        box-shadow: 0 3px 3px rgba(0,0,0,0.4);
    }
    .switch.down {
        background-color: #333333;
        color: transparent;
        box-shadow: 0 2px 2px rgba(0,0,0,0.3);
    }
    .cycle-switch.horizontal .title {
        margin: 0;
    }
    .cycle-switch.horizontal .switch {
        margin: 0;
    }
    
</style>
<div class="cycle-switch ${e.format}">
    <div class="title">${e.title}</div>
    <div class="switch">${e.selectedLabel}</div>
</div>
    `;constructor(){super()}connectedCallback(){super.connectedCallback(),this._selectedIndex=0,this._downState=!1,this._options=Array.from(this.querySelectorAll("option")).map((e,t)=>(e.selected&&(this._selectedIndex=t),{label:e.innerHTML,value:this._props.numeric?Number(e.value):e.value}));var e={...this._props,selectedLabel:this._options[this._selectedIndex].label,foregroundColor:getComputedStyle(this).getPropertyValue("color")};this._root.innerHTML=CycleSwitch.template(e),this._updateView(),this._addControlListeners()}_updateView(){var e=this._root.querySelector(".switch");e.innerHTML=this._options[this._selectedIndex].label,e.classList.toggle("down",this._downState)}_addControlListeners(){addTwiddling(this._root.querySelector(".switch")).onStart(()=>{this._selectedIndex===this._options.length-1?this._selectedIndex=0:this._selectedIndex++,this._downState=!0,this._updateView(),this.dispatchChangeEvent()}).onEnd(()=>{this._downState=!1,this._updateView()})}get value(){return this._options[this._selectedIndex].value}set value(o){this._options.forEach((e,t)=>{e.value===o&&(this._selectedIndex=t)}),this._updateView()}}customElements.define("cycle-switch",CycleSwitch);class ModWheel extends HTMLElement{static propTypes={id:PropTypes.string,class:PropTypes.string,style:PropTypes.string,value:PropTypes.number.default(0).observed,minValue:PropTypes.number.default(0),maxValue:PropTypes.number.default(1),snapBack:PropTypes.bool.default(!1),dataModule:PropTypes.string,dataControl:PropTypes.string};static template=e=>`
<style>
    .mod-wheel {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-items: center;
        position: relative;
        padding: 0 10px;
    }
    .title {
        text-align: center;
        margin-bottom: 0.5em;
    }
    .slider {
        position: relative;
        width: 40px;
        height: 170px;
        text-align: center;
    }
    .track {
        display: inline-block;
        width: 40px;
        height: 100%;
        border-radius: 20px;
        background-color: black;
    }
    .knob {
        box-sizing: border-box;
        position: absolute;
        width: 30px;
        height: 30px;
        border-radius: 15px;
        left: 50%;
        background-color: gray;
        transform: translate(-50%, -50%);
    }
</style>
<div class="mod-wheel">
    <div class="title">${e.title}</div>
    <div class="slider">
        <div class="track"></div>
        <div class="knob"></div>
    </div>
</div>
    `;constructor(){super()}connectedCallback(){this._root=this.attachShadow({mode:"open"}),this._props=PropTypes.attributesToProps(this),this._title=this.innerHTML;var e={...this._props,title:this._title};this._root.innerHTML=ModWheel.template(e),this._minY=20,this._maxY=150,this._updateView(),this._addControlListeners()}attributeChangedCallback(e,t,o){this._root&&(this._props[e]=PropTypes.attributesToProps(this,e))}_updateView(){var{value:e,minValue:t,maxValue:o}=this._props,i=this._root.querySelector(".knob");this._knobY=this._maxY-(e-t)/(o-t)*(this._maxY-this._minY),i.style.top=this._knobY+"px"}_addControlListeners(){let{minValue:o,maxValue:i}=this._props;var e=this._root.querySelector(".slider");let s;addTwiddling(e).onStart(()=>{s=this._props.value}).onTwiddle((e,t)=>{t=s-t*(i-o)/(this._maxY-this._minY);this._props.value=Math.max(Math.min(t,i),o),this._updateView(),this._dispatchChangeEvent()}).onEnd(()=>{this._props.snapBack&&(this._props.value=0,this._updateView(),this._dispatchChangeEvent())})}_dispatchChangeEvent(){var e=new CustomEvent("input");this.dispatchEvent(e)}get value(){return this._props.value}set value(e){this._props.value=Number(e),this._updateView()}}function mapRange(o,e,i){return Array.from(Array(e-o+1)).map((e,t)=>i(t+o))}customElements.define("mod-wheel",ModWheel);let template$1=e=>`
<div class="keyboard-controls">
    <keyboard-adjuster 
        id="keyboard-adjuster"
        bottom-note="${e.bottomNote}"
        top-note="${e.topNote}"
        data-module="keyboard"
        data-control="adjuster"
    > </keyboard-adjuster>
    <button class="keyboard-range" value="88">88</button>
    <button class="keyboard-range" value="61">61</button>
    <button class="keyboard-range" value="49">49</button>
    <button class="keyboard-range" value="default">Reset</button>
    <cycle-switch module-id="transient" parameter-name="velocityType" format="horizontal" title="">
        ${e.isTouchDevice?`<option value="touch" ${"touch"===e.velocity?"selected":""}>TOUCH</option>`:""}
        <option value="position" ${"position"===e.velocity?"selected":""}>POS&apos;N</option>
        <option value="100" ${"100"===e.velocity?"selected":""}>MAX</option>
        <option value="70" ${"70"===e.velocity?"selected":""}>70%</option>
        <option value="50" ${"50"===e.velocity?"selected":""}>50%</option>
        <option value="30" ${"30"===e.velocity?"selected":""}>30%</option>
    </cycle-switch>
</div>
<div class="keyboard-keys">${keyBoardTemplate(e)}</div>
`,keyBoardTemplate=e=>`
<div class="ivory keys">
    ${mapRange(e.bottomNote,e.topNote,e=>{var t=Math.floor(e/12)-1,o=e%12,i=0==o;return[1,3,6,8,10].includes(o)?"":`<div class="key ${i?"with-label":""} ${60===e?"middle-c":""}" data-note="${e}">${i?t:"0"}</div>`}).join("")}
</div>
<div class="ebony keys">
    <div class="first spacer"> </div>
    ${mapRange(e.bottomNote,e.topNote,e=>{var t=e%12;return[1,3,6,8,10].includes(t)?`<div class="key note-${t}" data-note="${e}"> </div>`:'<div class="spacer"> </div>'}).join("")}
    <div class="last spacer"> </div>
</div>
`;class SoftKeyboardModule extends AudioModule{_initialise(){super._initialise(),this._isTouchDevice=!this._options.mousePointer,this._normalRadius=this._options.normalTouchRadiusX,this._patch.set({velocityType:this._isTouchDevice?"touch":"position"}),this._downKeys=[],this._currentNote=void 0,this._render(),this._keyboard=document.querySelector(".keyboard-keys"),this._isTouchDevice?(this._notesTouched=[],this._keyboard.addEventListener("touchstart",e=>this._compareNotesTouched(e)),this._keyboard.addEventListener("touchmove",e=>this._compareNotesTouched(e)),this._keyboard.addEventListener("touchcancel",e=>this._compareNotesTouched(e)),this._keyboard.addEventListener("touchend",e=>this._compareNotesTouched(e))):this._keyboard.addEventListener("mousedown",e=>this._onKeyMouseDown(e)),Array.from(document.querySelectorAll("button.keyboard-range")).forEach(e=>{e.addEventListener("click",e=>this._onKeyboardRangeClick(e))}),this._eventBus.addEventListener(MidiEvent.type,e=>this._onMidiEvent(e)),document.getElementById("keyboard-adjuster").addEventListener("input",e=>{this._patch.set({bottomNote:e.target.bottomNote,topNote:e.target.topNote}),this._update()}),this._masterVolume=new GainNode(this._audioContext,{gain:1})}get _initialPatch(){return{velocityType:"70",bottomNote:45,topNote:84,masterVolume:1}}_render(){document.querySelector(".keyboard").innerHTML=template$1(Object.assign({isTouchDevice:this._isTouchDevice},this._patch.attributes))}_onPatchChange(e){super._onPatchChange(e),this._update()}_update(){var e;(this._patch.hasChanged("bottomNote")||this._patch.hasChanged("topNote"))&&(document.querySelector(".keyboard-keys").innerHTML=keyBoardTemplate(this._patch.attributes),(e=document.getElementById("keyboard-adjuster")).bottomNote=this._patch.get("bottomNote"),e.topNote=this._patch.get("topNote")),this._patch.hasChanged("masterVolume")&&this._masterVolume.gain.setTargetAtTime(this._patch.get("masterVolume"),this._now,this._minimumTimeConstant)}_onKeyboardRangeClick(e){var{bottomNote:o,topNote:i}=this._patch.attributes;switch(e.target.value){case"transpose-down":21<o&&this._patch.set({bottomNote:o-12,topNote:i-12});break;case"transpose-up":i<108&&this._patch.set({bottomNote:o+12,topNote:i+12});break;case"fewer-octaves":24<i-o&&this._patch.set({topNote:i-12});break;case"more-octaves":if(i-o<87){let e=o,t=i+12;96<i&&(e-=12,t-=12),this._patch.set({topNote:t,bottomNote:e})}break;case"88":this._patch.set({topNote:108,bottomNote:21});break;case"76":this._patch.set({topNote:103,bottomNote:28});break;case"61":this._patch.set({topNote:96,bottomNote:36});break;case"49":this._patch.set({topNote:84,bottomNote:36});break;case"default":this._patch.set({topNote:this._initialPatch.topNote,bottomNote:this._initialPatch.bottomNote})}this._update()}_onMidiEvent(e){var t,{statusByte:e,dataByte1:o}=e.detail;128<=e&&e<=143?(t=this._keyboard.querySelector(`.key[data-note="${o}"]`))&&t.classList.toggle("down",!1):144<=e&&e<=159&&(t=this._keyboard.querySelector(`.key[data-note="${o}"]`))&&t.classList.toggle("down",!0)}_onKeyMouseDown(e){e.preventDefault();var t,o=e.target;o.classList.contains("key")&&(e="position"===(t=this._patch.get("velocityType"))?Math.floor(128*e.offsetY/o.offsetHeight):Math.floor(1.28*parseInt(t)),t=Number(o.getAttribute("data-note")),this._eventBus.dispatchEvent(new MidiEvent(MidiEvent.NOTE_ON,t,e)),this._currentNote=t,document.body.addEventListener("mousemove",this._onKeyMouseMove),document.body.addEventListener("mouseup",this._onKeyMouseUp))}_onKeyMouseMove=e=>{var t,o,i=document.elementFromPoint(e.pageX,e.pageY);i.classList.contains("key")?(t=Number(i.getAttribute("data-note")))!==this._currentNote&&(e="position"===(o=this._patch.get("velocityType"))?Math.floor(128*e.offsetY/i.offsetHeight):Math.floor(1.28*parseInt(o)),this._eventBus.dispatchEvent(new MidiEvent(MidiEvent.NOTE_ON,t,e)),this._eventBus.dispatchEvent(new MidiEvent(MidiEvent.NOTE_OFF,this._currentNote,70)),this._currentNote=t):(this._eventBus.dispatchEvent(new MidiEvent(MidiEvent.NOTE_OFF,this._currentNote,70)),delete this._currentNote,document.body.removeEventListener("mousemove",this._onKeyMouseMove),document.body.removeEventListener("mouseup",this._onKeyMouseUp))};_onKeyMouseUp=e=>{this._currentNote&&(this._eventBus.dispatchEvent(new MidiEvent(MidiEvent.NOTE_OFF,this._currentNote,70)),delete this._currentNote,document.body.removeEventListener("mousemove",this._onKeyMouseMove),document.body.removeEventListener("mouseup",this._onKeyMouseUp))};_compareNotesTouched(e){e.preventDefault();let n=[],r={};Array.from(e.touches).forEach(t=>{var o=document.elementFromPoint(t.pageX,t.pageY);if(o.classList.contains("key")){var i=Number(o.getAttribute("data-note"));n.includes(i)||n.push(i);let e;var s=this._patch.get("velocityType");switch(s){case"touch":e=Math.min(128,Math.max(0,Math.floor(70*t.radiusX/this._normalRadius)));break;case"position":var a=o.getBoundingClientRect();e=Math.min(128,Math.max(0,Math.floor(128*(t.clientY-a.top)/a.height)));break;default:e=Math.min(128,Math.floor(1.28*parseInt(s)))}r[i]=e}}),n.filter(e=>!this._notesTouched.includes(e)).forEach(e=>{this._eventBus.dispatchEvent(new MidiEvent(MidiEvent.NOTE_ON,e,r[e]))}),this._notesTouched.filter(e=>!n.includes(e)).forEach(e=>{this._eventBus.dispatchEvent(new MidiEvent(MidiEvent.NOTE_OFF,e,70))}),this._notesTouched=n}get audioIn(){return this._masterVolume}get audioOut(){return this._masterVolume}}class PolyOscillator extends PolyAudioNode{get _AudioNodeClass(){return OscillatorNode}set type(e){this.setPolyProperty("type",e)}get type(){return this.getPolyProperty("type")}get frequency(){return this.getPolyParam("frequency")}get detune(){return this.getPolyParam("detune")}}class PolyGain extends PolyAudioNode{get _AudioNodeClass(){return GainNode}get gain(){return this.getPolyParam("gain")}}function midiNoteToHertz$2(e){return 440*Math.pow(2,(e-69)/12)}class PolyOscillatorModule extends AudioModule{_initialise(){var e=this._audioContext;this._oscillatorNode=new PolyOscillator(e,{type:this._patch.get("waveform"),frequency:this._hertzFromPatch}),this._modulation=new GainNode(e,{gain:this._patch.get("modAmount")}),this._oscillatorNode.detune.fanOutConnectFrom(this._modulation),this._crossModulation=new PolyGain(e,{gain:this._patch.get("crossModAmount")}),this._crossModulation.polyConnectTo(this._oscillatorNode.detune)}get _initialPatch(){return{waveform:"sine",range:0,tune:0,fineTune:0,modAmount:100,crossModAmount:0}}_onPatchChange(e){super._onPatchChange(e),this._update()}get _hertzFromPatch(){var{range:e,tune:t,fineTune:o}=this._patch.attributes;return midiNoteToHertz$2(60+12*e+t+o/100)}_update(){this._oscillatorNode.type=this._patch.get("waveform"),this._oscillatorNode.frequency.setTargetAtTime(this._hertzFromPatch,this._now,this._minimumTimeConstant),this._modulation.gain.setTargetAtTime(this._patch.get("modAmount"),this._now,this._minimumTimeConstant),this._crossModulation.gain.setTargetAtTime(this._patch.get("crossModAmount"),this._now,this._minimumTimeConstant)}get offsetCentsIn(){return this._oscillatorNode.detune}get modulationIn(){return this._modulation}get crossModulationIn(){return this._crossModulation}get audioOut(){return this._oscillatorNode}}class PolyAmpModule extends AudioModule{_initialise(){super._initialise();var e=this._audioContext;this._gainNode=new PolyGain(e,{gain:0})}get modulationIn(){return this._gainNode.gain}get audioIn(){return this._gainNode}get audioOut(){return this._gainNode}}function midiNoteToHertz$1(e){return 440*Math.pow(2,(e-69)/12)}let C4$1=midiNoteToHertz$1(60);function noteToStretchFactor(e){return.3+.7*C4$1/midiNoteToHertz$1(e)}class PolyEnvelopeModule extends AudioModule{_initialise(){super._initialise();var e=this._audioContext;this._sustain=!1,this._sustainedNotes=[],this._envelope=new PolyConstantSource(e,{offset:0}),this._eventBus.addEventListener(NoteChangeEvent.type,e=>this._onNoteChange(e)),this._eventBus.addEventListener("sustainchange",e=>this._onSustainChange(e))}get _initialPatch(){return{attackSeconds:0,decaySeconds:0,sustainLevel:1,releaseSeconds:0,velocityAmount:1,expression:0}}_onSustainChange(e){var{}=this._globalPatch.attributes;this._sustain&&!e.detail.isOn&&(this._sustainedNotes.forEach(e=>{var t,e=e.voiceNumber;this._envelope.nodes[e]&&(e=this._envelope.nodes[e].offset,t=this._patch.attributes.releaseSeconds,t=Math.max(this._minimumTimeConstant,t),e.cancelScheduledValues(this._now).setTargetAtTime(0,this._now,t))}),this._sustainedNotes=[]),this._sustain=e.detail.isOn}_onNoteChange(e){let{newNoteNumber:t,oldNoteNumber:o,voiceNumber:i,velocity:s}=e.detail;var a,n,r,l,h,e=this._envelope.nodes[i].offset,{legato:d,envelopeStretch:c}=this._globalPatch.attributes;void 0!==t?d&&void 0!==o||(d=c?noteToStretchFactor(t):1,{attackSeconds:n,decaySeconds:l,sustainLevel:h,velocityAmount:a,expression:r}=this._patch.attributes,a=h*(h=s/64*a+(1-a)),n=Math.max(this._minimumTimeConstant,n*(1-r*s/127)),r=Math.max(this._minimumTimeConstant,l*d),0===e.value&&e.setValueAtTime(0,this._now),e.cancelScheduledValues(this._now).linearRampToValueAtTime(h,this._now+n).setTargetAtTime(a,this._now+n,r),this._sustainedNotes=this._sustainedNotes.filter(e=>e.voiceNumber!==i)):this._sustain?(this._sustainedNotes=this._sustainedNotes.filter(e=>e.voiceNumber!==i),this._sustainedNotes.push({voiceNumber:i,note:o})):(l=c?noteToStretchFactor(o):1,d=this._patch.attributes.releaseSeconds,h=Math.max(this._minimumTimeConstant,d*l),e.cancelAndHoldAtTime(this._now).setTargetAtTime(0,this._now,h))}get envelopeOut(){return this._envelope}}class PolyLevelModule extends AudioModule{_initialise(){super._initialise();var e=this._audioContext;this._gainNode=new PolyGain(e,{gain:0})}get _initialPatch(){return{level:0}}_onPatchChange(e){super._onPatchChange(e),this._gainNode.gain.setTargetAtTime(this._patch.get("level"),this._now,this._minimumTimeConstant)}get audioIn(){return this._gainNode}get audioOut(){return this._gainNode}}class PolyBiquadFilter extends PolyAudioNode{get _AudioNodeClass(){return BiquadFilterNode}set type(e){this.setPolyProperty("type",e)}get type(){return this.getPolyProperty("type")}get frequency(){return this.getPolyParam("frequency")}get detune(){return this.getPolyParam("detune")}get Q(){return this.getPolyParam("Q")}get gain(){return this.getPolyParam("gain")}}function midiNoteToHertz(e){return 440*Math.pow(2,(e-69)/12)}let C4=midiNoteToHertz(60);class PolyFilterModule extends AudioModule{_initialise(){var e=this._audioContext;this._filterNode=new PolyBiquadFilter(e,{type:this._patch.get("type"),frequency:this._patch.get("frequency"),Q:this._patch.get("resonance"),detune:0}),this._filterNode2=new PolyBiquadFilter(e,{type:this._patch.get("type"),frequency:this._patch.get("frequency"),Q:this._patch.get("resonance"),detune:0}),this._modulation=new GainNode(e,{gain:this._patch.get("modAmount")}),this._filterNode.detune.fanOutConnectFrom(this._modulation),this._filterNode2.detune.fanOutConnectFrom(this._modulation),this._keyboardFollow=new PolyGain(e,{gain:this._patch.get("keyboardFollowAmount")}),this._keyboardFollow.polyConnectTo(this._filterNode.detune),this._keyboardFollow.polyConnectTo(this._filterNode2.detune),this._envelope=new PolyGain(e,{gain:this._patch.get("envelopeAmount")}),this._filterNode.detune.polyConnectFrom(this._envelope),this._filterNode2.detune.polyConnectFrom(this._envelope),this._filterNode.polyConnectTo(this._filterNode2)}get _initialPatch(){return{type:"lowpass",rolloff:12,frequency:C4,resonance:1,modAmount:0,keyboardFollowAmount:1,envelopeAmount:0}}_onPatchChange(e){super._onPatchChange(e),this._update()}_update(){this._filterNode.type=this._patch.get("type"),this._filterNode.frequency.setTargetAtTime(this._patch.get("frequency"),this._now,this._minimumTimeConstant),this._filterNode.Q.setTargetAtTime(this._patch.get("resonance"),this._now,this._minimumTimeConstant),this._modulation.gain.setTargetAtTime(this._patch.get("modAmount"),this._now,this._minimumTimeConstant),this._keyboardFollow.gain.setTargetAtTime(this._patch.get("keyboardFollowAmount"),this._now,this._minimumTimeConstant),this._envelope.gain.setTargetAtTime(this._patch.get("envelopeAmount"),this._now,this._minimumTimeConstant),12===this._patch.get("rolloff")?(this._filterNode2.type="lowpass",this._filterNode2.frequency.setTargetAtTime(22050,this._now,this._minimumTimeConstant),this._filterNode2.Q.setTargetAtTime(0,this._now,this._minimumTimeConstant)):(this._filterNode2.type=this._patch.get("type"),this._filterNode2.frequency.setTargetAtTime(this._patch.get("frequency"),this._now,this._minimumTimeConstant),this._filterNode2.Q.setTargetAtTime(this._patch.get("resonance"),this._now,this._minimumTimeConstant))}get modulationIn(){return this._modulation}get keyboardFollowIn(){return this._keyboardFollow}get envelopeIn(){return this._envelope}get audioIn(){return this._filterNode}get audioOut(){return this._filterNode2}}class MidiModule extends AudioModule{_initialise(){super._initialise(),navigator.requestMIDIAccess&&this._connectToMIDI()}_connectToMIDI(){navigator.requestMIDIAccess().then(e=>{for(var t of e.inputs){t=t[1];console.log(`Input port [type:'${t.type}']`+` id:'${t.id}'`+` manufacturer:'${t.manufacturer}'`+` name:'${t.name}'`+` version:'${t.version}'`)}e.inputs.forEach(e=>{e.onmidimessage=e=>this._onMIDIMessage(e)})},function(e){console.error("Failed to get MIDI access - "+e)})}_onMIDIMessage(e){e=e.data;let t=e[0];128<=t&&t<=143?t=MidiEvent.NOTE_OFF:144<=t&&t<=159?t=MidiEvent.NOTE_ON:224<=t&&t<=239?t=MidiEvent.PITCH_BEND:176<=t&&t<=191&&(t=MidiEvent.CONTROLLER),this._eventBus.dispatchEvent(new MidiEvent(t,e[1],e[2]))}}class ControllerHelperModule extends AudioModule{_initialise(){super._initialise();var e=this._audioContext;this._modWheelValue=0,this._pitchBendOut=new ConstantSourceNode(e,{offset:0}),this._pitchBendOut.start(),this._eventBus.addEventListener(MidiEvent.type,e=>this._onMIDIMessage(e))}get _initialPatch(){return{pitchBendMax:200,modulationMax:100}}_onMIDIMessage(e){var{statusByte:e,dataByte1:t,dataByte2:o}=e.detail;e===MidiEvent.PITCH_BEND?this._onPitchBend(o):e===MidiEvent.CONTROLLER&&t===MidiEvent.MOD_WHEEL?this._onModWheel(o):e===MidiEvent.CONTROLLER&&t===MidiEvent.SUSTAIN_PEDAL&&this._onSustainPedal(o)}_onPitchBend(e){this._pitchBendOut.offset.setTargetAtTime(this._patch.get("pitchBendMax")*(e-64)/64,this._now,this._minimumTimeConstant),this._triggerPitchBendEvent(e)}_onModWheel(e){this._modWheelValue=e,this._triggerModWheelEvent(e)}_triggerModWheelEvent(e){e=new CustomEvent("modwheel",{detail:{midiValue:e,value:this._patch.get("modulationMax")*e/127}});this._eventBus.dispatchEvent(e)}_triggerPitchBendEvent(e){e=new CustomEvent("pitchbend",{detail:{midiValue:e}});this._eventBus.dispatchEvent(e)}_onSustainPedal(e){e=new CustomEvent("sustainchange",{detail:{isOn:0<e}});this._eventBus.dispatchEvent(e)}_onPatchChange(e){super._onPatchChange(e),this._update()}_update(){this._triggerModWheelEvent(this._modWheelValue)}get pitchBend(){return this._pitchBendOut}}function fetchAndCacheBuffers(s,a){return new Promise(o=>{let i=[];a.forEach(t=>{fetch(t).then(e=>{e.arrayBuffer().then(e=>{s.decodeAudioData(e).then(e=>{i.push({path:t,buffer:e}),i.length===a.length&&o(i)})})})})})}class NoiseModule extends AudioModule{_initialise(){var e=this._audioContext;this._gain=e.createGain(),fetchAndCacheBuffers(e,["media/white-noise.mp3","media/pink-noise.mp3","media/brown-noise.mp3"]).then(e=>{this._buffers={},e.forEach(e=>{this._buffers[e.path.replace(/^.*\/(\w+)-noise\.mp3$/,"$1")]=e.buffer}),this._update()})}get _initialPatch(){return{type:"white"}}_onPatchChange(e){super._onPatchChange(e),this._update()}_update(){!this._buffers||this._source&&!this._patch.hasChanged("type")||(this._source&&(this._source.stop(),delete this._source.buffer,this._source.disconnect(this._gain),delete this._source),this._source=this._audioContext.createBufferSource(),this._source.buffer=this._buffers[this._patch.get("type")],this._source.loop=!0,this._source.loopStart=.2,this._source.loopEnd=this._source.buffer.duration-.2,this._source.connect(this._gain),this._source.start())}get noiseOut(){return this._gain}}class DelayEffectModule extends AudioModule{_initialise(){var e=this._audioContext;this._audioIn=new GainNode(e,{gain:1}),this._audioOut=new GainNode(e,{gain:1}),this._panner1=new StereoPannerNode(e,{pan:0}),this._panner2=new StereoPannerNode(e,{pan:0}),this._feedback1=new GainNode(e,{gain:.5}),this._feedback2=new GainNode(e,{gain:.5}),this._dryLevel=new GainNode(e,{gain:.5}),this._wetLevel=new GainNode(e,{gain:.5}),this._panner1.connect(this._wetLevel),this._panner2.connect(this._wetLevel),this._createDelayNodes(),this._update()}get _initialPatch(){return{power:!1,mix:.5,time:.1,feedback:.5,spread:0}}_onPatchChange(e){super._onPatchChange(e),this._update()}_destroyDelayNodes(){this._delay1&&(this._delay1.disconnect(),this._delay2.disconnect(),this._feedback1.disconnect(),this._feedback2.disconnect(),this._delay1=void 0,this._delay2=void 0)}_createDelayNodes(){var e=this._audioContext;this._delay1&&this._destroyDelayNodes(),this._delay1=e.createDelay(10),this._delay2=e.createDelay(10),this._delay1.connect(this._feedback1),this._delay1.connect(this._panner1),this._feedback1.connect(this._delay2),this._delay2.connect(this._feedback2),this._delay2.connect(this._panner2),this._feedback2.connect(this._delay1)}_update(){var e=this._patch.get("power"),t=this._patch.get("mix"),o=this._patch.get("time"),i=this._patch.get("feedback"),s=this._patch.get("spread");this._patch.hasChanged("power")&&(e?(this._audioIn.disconnect(),this._createDelayNodes(),this._audioIn.connect(this._delay1),this._audioIn.connect(this._dryLevel),this._dryLevel.connect(this._audioOut),this._wetLevel):(this._audioIn.disconnect(),this._audioIn.disconnect(),this._dryLevel.disconnect(),this._wetLevel.disconnect(),this._destroyDelayNodes(),this._audioIn)).connect(this._audioOut),t<=.5?(this._dryLevel.gain.setTargetAtTime(1,this._now,this._minimumTimeConstant),this._wetLevel.gain.setTargetAtTime(2*t,this._now,this._minimumTimeConstant)):(this._wetLevel.gain.setTargetAtTime(1,this._now,this._minimumTimeConstant),this._dryLevel.gain.setTargetAtTime(2*(1-t),this._now,this._minimumTimeConstant)),this._delay1&&this._delay1.delayTime.setTargetAtTime(10*o,this._now,this._minimumTimeConstant),this._delay2&&this._delay2.delayTime.setTargetAtTime(10*o,this._now,this._minimumTimeConstant),this._feedback1.gain.setTargetAtTime(i,this._now,this._minimumTimeConstant),this._feedback2.gain.setTargetAtTime(i,this._now,this._minimumTimeConstant),this._panner1.pan.setTargetAtTime(s,this._now,this._minimumTimeConstant),this._panner2.pan.setTargetAtTime(-1*s,this._now,this._minimumTimeConstant)}get audioOut(){return this._audioOut}get audioIn(){return this._audioIn}}class ReverbEffectModule extends AudioModule{_initialise(){var e=this._audioContext;this._buffers={},this._isFirstUpdate=!0,fetchAndCacheBuffers(e,["media/irs/small.mp3","media/irs/medium.mp3","media/irs/large.mp3","media/irs/huge.mp3"]).then(e=>{e.forEach(e=>{this._buffers[e.path.replace(/^.*\/(\w+)\.mp3$/,"$1")]=e.buffer}),this._update()}),this._audioIn=new GainNode(e,{gain:1}),this._audioOut=new GainNode(e,{gain:1}),this._dryLevel=new GainNode(e,{gain:.5}),this._wetLevel=new GainNode(e,{gain:.5}),this._createConvolverNode()}get _initialPatch(){return{power:!1,mix:.5,type:"small",highPass:0}}_onPatchChange(e){super._onPatchChange(e),this._update()}_destroyConvolverNode(){this._convolver.disconnect(),this._convolver=void 0}_createConvolverNode(){var e=this._audioContext;this._convolver&&this._destroyConvolverNode(),this._convolver=new ConvolverNode(e),this._convolver.normalize=!0,this._convolver.connect(this._wetLevel)}_update(){var e=this._patch.get("power"),t=this._patch.get("mix"),o=this._patch.get("type");(this._patch.hasChanged("power")||this._isFirstUpdate)&&(e?(this._audioIn.disconnect(),this._createConvolverNode(),this._audioIn.connect(this._convolver),this._audioIn.connect(this._dryLevel),this._dryLevel.connect(this._audioOut),this._wetLevel):(this._audioIn.disconnect(),this._audioIn.disconnect(),this._dryLevel.disconnect(),this._wetLevel.disconnect(),this._destroyConvolverNode(),this._audioIn)).connect(this._audioOut),t<=.5?(this._dryLevel.gain.setTargetAtTime(1,this._now,this._minimumTimeConstant),this._wetLevel.gain.setTargetAtTime(2*t,this._now,this._minimumTimeConstant)):(this._wetLevel.gain.setTargetAtTime(1,this._now,this._minimumTimeConstant),this._dryLevel.gain.setTargetAtTime(2*(1-t),this._now,this._minimumTimeConstant)),this._convolver&&(this._patch.hasChanged("type")||this._isFirstUpdate||this._patch.hasChanged("power"))&&(e=this._buffers[o])&&(this._convolver.buffer=e),this._isFirstUpdate=!1}get audioOut(){return this._audioOut}get audioIn(){return this._audioIn}}class LevelsEffectModule extends AudioModule{_initialise(){var e=this._audioContext;this._audioIn=new GainNode(e,{gain:1}),this._audioOut=new GainNode(e,{gain:1}),this._bass=new BiquadFilterNode(e,{type:"lowshelf",frequency:100,gain:0}),this._treble=new BiquadFilterNode(e,{type:"highshelf",frequency:1e3,gain:0}),this._update()}get _initialPatch(){return{power:!1,bass:0,treble:0,master:.5}}_onPatchChange(e){super._onPatchChange(e),this._update()}_update(){var e=this._patch.get("power"),t=this._patch.get("bass"),o=this._patch.get("treble"),i=this._patch.get("master");this._patch.hasChanged("power")&&(e?(this._audioIn.disconnect(),this._audioIn.connect(this._bass),this._audioIn.connect(this._treble),this._bass.connect(this._audioOut),this._treble.connect(this._audioOut)):(this._audioIn.disconnect(),this._audioIn.disconnect(),this._bass.disconnect(),this._treble.disconnect(),this._audioIn.connect(this._audioOut),this._audioOut.gain.setTargetAtTime(1,this._now,this._minimumTimeConstant))),this._bass.gain.setTargetAtTime(50*t,this._now,this._minimumTimeConstant),this._treble.gain.setTargetAtTime(20*o,this._now,this._minimumTimeConstant),e&&this._audioOut.gain.setTargetAtTime(3*i,this._now,this._minimumTimeConstant)}get audioOut(){return this._audioOut}get audioIn(){return this._audioIn}}class PhaserEffectModule extends AudioModule{_initialise(){var e=this._audioContext;this._audioIn=new GainNode(e,{gain:1}),this._audioOut=new GainNode(e,{gain:1}),this._dryLevel=new GainNode(e,{gain:.5}),this._wetLevel=new GainNode(e,{gain:-.5}),this._lfo=new OscillatorNode(e,{type:"sine",frequency:1}),this._gain=new GainNode(e,{gain:.1}),this._delayTime=new ConstantSourceNode(e,{offset:0}),this._constant=new ConstantSourceNode(e,{offset:1}),this._feedback=new GainNode(e,{gain:0}),this._lfo.connect(this._gain),this._constant.connect(this._gain),this._createDelayNode(),this._constant.start(),this._delayTime.start(),this._lfo.start(),this._update()}get _initialPatch(){return{power:!1,mix:.5,rate:.1,depth:1,resonance:.5,delay:0}}_onPatchChange(e){super._onPatchChange(e),this._update()}_destroyDelayNode(){this._delay&&(this._gain.disconnect(),this._delayTime.disconnect(),this._feedback.disconnect(),this._delay.disconnect(),this._delay=void 0)}_createDelayNode(){var e=this._audioContext;this._delay&&this._destroyDelayNode(),this._delay=new DelayNode(e,{delayTime:0}),this._gain.connect(this._delay.delayTime),this._delayTime.connect(this._delay.delayTime),this._delay.connect(this._wetLevel),this._feedback.connect(this._delay)}_update(){var e=this._patch.get("power"),t=this._patch.get("mix"),o=this._patch.get("rate"),i=this._patch.get("depth"),s=this._patch.get("resonance"),a=this._patch.get("delay");this._patch.hasChanged("power")&&(e?(this._audioIn.disconnect(),this._createDelayNode(),this._audioIn.connect(this._delay),this._audioIn.connect(this._dryLevel),this._dryLevel.connect(this._audioOut),this._wetLevel.connect(this._audioOut),this._dryLevel.connect(this._feedback),this._wetLevel.connect(this._feedback)):(this._audioIn.disconnect(),this._audioIn.disconnect(),this._dryLevel.disconnect(),this._wetLevel.disconnect(),this._destroyDelayNode(),this._audioIn.connect(this._audioOut))),t<=.5?(this._dryLevel.gain.setTargetAtTime(1,this._now,this._minimumTimeConstant),this._wetLevel.gain.setTargetAtTime(-2*t,this._now,this._minimumTimeConstant)):(this._wetLevel.gain.setTargetAtTime(-1,this._now,this._minimumTimeConstant),this._dryLevel.gain.setTargetAtTime(2*(1-t),this._now,this._minimumTimeConstant)),this._gain.gain.setTargetAtTime(.1*i/(o+1),this._now,this._minimumTimeConstant),this._lfo.frequency.setTargetAtTime(o,this._now,this._minimumTimeConstant),this._delayTime.offset.setTargetAtTime(a,this._now,this._minimumTimeConstant),this._feedback.gain.setTargetAtTime(s,this._now,this._minimumTimeConstant)}get audioOut(){return this._audioOut}get audioIn(){return this._audioIn}}class ModularSynth extends EventTarget{constructor(){super(),this.audioContext=new(window.AudioContext||window.webkitAudioContext),this.eventBus=new EventTarget,this._patch=new Model({global:new Model(this._initialGlobalPatch)}),this._patch.addEventListener("change",e=>this.dispatchEvent(new CustomEvent("patch-change"))),this.globalPatch.addEventListener("change",e=>this.dispatchEvent(new CustomEvent("patch-change"))),this._initialState&&(this._state=new Model(this._initialState),this._state.addEventListener("change",e=>this.dispatchEvent(new CustomEvent("state-change")))),this._modulesPendingBindings={global:this},this._controlsPendingBindings=[],document.addEventListener("register-control",this.registerControl)}registerControl=e=>{let t=e.target;var o=e.detail.moduleId;let i=this._modulesPendingBindings[o],s=e.detail.parameterName;i?setTimeout(()=>this.bindControlToModule(t,i,s),0):this._controlsPendingBindings.push({control:t,moduleId:o,parameterName:s})};bindControlToModule(e,t,o){let i=()=>{e.value=t.getParam(o)};i();e.addEventListener("change",()=>{t.setParam(o,e.value),location.search&&history.replaceState({},"",location.origin+location.pathname)}),t.addEventListener("patch-change",()=>{t.paramChanged(o)&&i()})}get _initialState(){}get _initialGlobalPatch(){return{totalVoices:1,legato:!1}}_moduleCreator(i){return(t,e)=>{let o=new i(this.audioContext,this.eventBus,this.globalPatch,e);return t&&(this._patch.set({[t]:o._patch}),0<this._controlsPendingBindings.length)&&(this._controlsPendingBindings.forEach(e=>{e.moduleId===t&&this.bindControlToModule(e.control,o,e.parameterName)}),this._controlsPendingBindings=this._controlsPendingBindings.filter(e=>e.moduleId!==t)),o}}createMidiModule=this._moduleCreator(MidiModule);createControllerHelperModule=this._moduleCreator(ControllerHelperModule);createSoftKeyboardModule=this._moduleCreator(SoftKeyboardModule);createVoiceAllocatorModule=this._moduleCreator(VoiceAllocatorModule);createPolyOscillatorModule=this._moduleCreator(PolyOscillatorModule);createPolyAmpModule=this._moduleCreator(PolyAmpModule);createPolyEnvelopeModule=this._moduleCreator(PolyEnvelopeModule);createPolyLevelModule=this._moduleCreator(PolyLevelModule);createPolyFilterModule=this._moduleCreator(PolyFilterModule);createLFOModule=this._moduleCreator(LFOModule);createNoiseModule=this._moduleCreator(NoiseModule);createDelayEffectModule=this._moduleCreator(DelayEffectModule);createReverbEffectModule=this._moduleCreator(ReverbEffectModule);createLevelsEffectModule=this._moduleCreator(LevelsEffectModule);createPhaserEffectModule=this._moduleCreator(PhaserEffectModule);get patch(){return this._patch.attributes}set patch(e){this._patch.set(e)}setParam(e,t){this.globalPatch.set({[e]:t})}getParam(e){return this.globalPatch.get(e)}paramChanged(e,t){return this.globalPatch.hasChanged(e,t)}get globalPatch(){return this._patch.get("global")}}class ToggleSwitch extends AbstractComponent{static propTypes={...AbstractComponent.propTypes,checked:PropTypes.bool.default(!1).observed,capColor:PropTypes.string.default(getThemeProps("bright-color")).observed,format:PropTypes.string.lookup(["vertical","horizontal"]).default("vertical"),onText:PropTypes.string.default("ON"),offText:PropTypes.string.default("OFF"),minWidth:PropTypes.string.default("40px")};static template=e=>`
<style>
    .toggle-switch {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-items: center;
        position: relative;
    }
    .toggle-switch.horizontal {
        flex-direction: row;
        gap: 0.5em;
    }
    .title {
        text-align: center;
        margin-bottom: 0.2em;
        color: ${e.foregroundColor};
    }
    .title:empty {
        display: none;
    }
    .switch {
        position: relative;
        box-sizing: border-box;
        min-width: ${e.minWidth};
        text-align: center;
        border: 4px solid black;
        border-radius: 4px;
        font-weight: bold;
        color: black;
        padding: 1px 0.5em;
        background: linear-gradient(to right, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), ${e.capColor};
        margin-bottom: 0.3em;
        box-shadow: 0 3px 3px rgba(0,0,0,0.4);
    }
    .toggle-switch.horizontal .title {
        margin: 0;
    }
    .toggle-switch.horizontal .switch {
        margin: 0;
    }
    
    .switch::before {
        content: '${e.offText}';
    }
    .switch.checked {
        background: radial-gradient(transparent, transparent, rgba(0, 0, 0, 0.3)), ${e.capColor};
        box-shadow: 0 1px 1px rgba(0,0,0,0.4);
    }
    .switch.checked::before {
        content: '${e.onText}';
    }
    
</style>
<div class="toggle-switch ${e.format}">
    <div class="title">${e.title}</div>
    <div class="switch"></div>
</div>
    `;constructor(){super()}connectedCallback(){super.connectedCallback(),this._title=this.innerHTML;var e={...this._props,title:this._title,foregroundColor:getComputedStyle(this).getPropertyValue("color")};this._root.innerHTML=ToggleSwitch.template(e),this._updateView(),this._addControlListeners()}_updateView(){var e=this._props.checked;this._root.querySelector(".switch").classList.toggle("checked",e)}_addControlListeners(){addTwiddling(this._root.querySelector(".switch")).onStart(()=>{this.value=!this.value,this.dispatchChangeEvent()})}get value(){return this._props.checked}set value(e){this._props.checked=!!e,this._updateView()}}customElements.define("toggle-switch",ToggleSwitch);let controllersTemplate=`
<div class="control-group">
    <mod-wheel id="pitch-bend" min-value="-64" max-value="64" snap-back data-module="expressionControls" data-control="pitchBend">Bend</mod-wheel>
    <mod-wheel id="mod-wheel" max-value="127" data-module="expressionControls" data-control="modWheel">Mod</mod-wheel>
</div>
`;class RotaryKnob extends AbstractComponent{static propTypes={...AbstractComponent.propTypes,scaleMin:PropTypes.number.default(0),scaleMax:PropTypes.number.default(10),scaleStep:PropTypes.number.default(1),scaleMinLabel:PropTypes.string.default(""),scaleMaxLabel:PropTypes.string.default(""),minimal:PropTypes.bool.default(!1),value:PropTypes.number.default(0).observed,minValue:PropTypes.number.default(0),maxValue:PropTypes.number.default(1),logarithmic:PropTypes.bool.default(!1),units:PropTypes.string.default(""),capColor:PropTypes.string.default(getThemeProps("normal-color")).observed};static template=e=>`
<style>
    .rotary-knob {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-items: center;
        position: relative;
    }
    .title {
        color: ${e.foregroundColor};
        text-align: center;
    }
    .rotor-container {
        position: relative;
        z-index: 2;
        width: 40px;
        height: 40px;
        border: 4px solid black;
        border-radius: 100%;
        background-color: ${e.capColor};
        text-align: center;
        margin: 1.5em;
        box-shadow: 0 10px 10px rgba(0,0,0,0.3), inset 0 2px 3px rgba(0,0,0,0.4);
    }
    .rotor {
        position: relative;
        z-index: 2;
        width: 40px;
        height: 40px;
    }
    .indicator {
        display: inline-block;
        width: 2px;
        height: 50%;
        background-color: black;
    }
    .tick {
        display: inline-block;
        width: 1px;
        height: 4px;
        background-color: ${e.foregroundColor};
    }
    .label {
        color: ${e.foregroundColor};
        font-size: 80%;
        transform: translate(-50%, -50%);
    }
</style>
<div class="rotary-knob">
    <div class="title">${e.title}</div>
    
    <div class="rotor-container">
        <div class="rotor">
            <div class="indicator"></div>
        </div>
    </div>
</div>
    `;constructor(){super()}connectedCallback(){super.connectedCallback(),this._title=this.innerHTML,this._minAngle=1.2*Math.PI,this._maxAngle=2.8*Math.PI,this._rotorAngle=this._minAngle;let{minValue:t,maxValue:o,logarithmic:e}=this._props;e?0===t?(this._toRatio=AbstractComponent.logToLinear(o,1),this._fromRatio=AbstractComponent.linearToLog(1,o)):(this._toRatio=AbstractComponent.logRangeToLinear(t,o,1),this._fromRatio=AbstractComponent.linearToLogRange(1,t,o)):(this._toRatio=e=>(e-t)/(o-t),this._fromRatio=e=>t+e*(o-t));var i={...this._props,title:this._title,foregroundColor:getComputedStyle(this).getPropertyValue("color")};this._initialValue=i.value,this._root.innerHTML=RotaryKnob.template(i),this._drawScale(),this._updateView(),this._addControlListeners()}_updateView(){this._root.querySelector(".rotor").style.transform=`rotate(${this._rotorAngle}rad)`}_drawScale(){var{scaleMin:t,scaleMax:o,scaleStep:i}=this._props,e=this._root.querySelector(".rotor-container"),s=e.offsetWidth/2;const a=e.offsetLeft+s,n=e.offsetTop+s;var r=8+s,l=1.6*Math.PI*i/(o-t);let h=this._minAngle-Math.PI;var d=this._root.querySelector(".rotary-knob");for(let e=t;e<=o;e+=i){var c=document.createElement("div"),c=(c.classList.add("tick"),d.append(c),c.style.position="absolute",c.style.top=n+Math.cos(h)*s+"px",c.style.left=a-Math.sin(h)*s+"px",c.style.transform=`translate(-50%, -50%) rotate(${h}rad)`,Math.round(100*e)/100),u=document.createElement("div");u.classList.add("label"),this._props.minimal&&0!=c?e===t?this._props.scaleMinLabel?u.innerHTML=this._props.scaleMinLabel:u.innerHTML=String(c).replace(/-/,"&minus;"):e===o&&(this._props.scaleMaxLabel?u.innerHTML=this._props.scaleMaxLabel:u.innerHTML="+"+c):u.innerHTML=c,d.append(u),u.style.position="absolute",u.style.top=n+Math.cos(h)*r+"px",u.style.left=a-Math.sin(h)*r+"px",h+=l}}_addControlListeners(){var e=this._root.querySelector(".rotor");let o;addTwiddling(e).onStart(()=>{o=this._rotorAngle}).onTwiddle((e,t)=>{this._rotorAngle=o+(e-t)/25,this._rotorAngle=Math.max(Math.min(this._rotorAngle,this._maxAngle),this._minAngle),this._updateView(),this.dispatchChangeEvent()}).onDoubleTap(()=>{this.value=this._initialValue,this.dispatchChangeEvent()})}get value(){var e=(this._rotorAngle-this._minAngle)/(this._maxAngle-this._minAngle);return this._fromRatio(e)}set value(e){e=Number(e),e=this._toRatio(e);this._rotorAngle=this._minAngle+e*(this._maxAngle-this._minAngle),this._updateView()}}customElements.define("rotary-knob",RotaryKnob);let LABELS_LEFT="left",LABELS_RIGHT="right",LABELS_AROUND="around";class RotarySwitch extends AbstractComponent{static propTypes={...AbstractComponent.propTypes,capColor:PropTypes.string.default(getThemeProps("normal-color")).observed,title:PropTypes.string.default("Title").observed,labels:PropTypes.string.lookup([LABELS_LEFT,LABELS_RIGHT,LABELS_AROUND]).default(LABELS_AROUND),numeric:PropTypes.bool.default(!1)};static template=e=>`
<style>
    .rotary-switch {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-items: center;
        position: relative;
    }
    .title {
        color: ${e.foregroundColor};
        text-align: center;
    }
    .rotor-container {
        position: relative;
        z-index: 2;
        width: 40px;
        height: 40px;
        border: 4px solid black;
        border-radius: 100%;
        background-color: ${e.capColor};
        text-align: center;
        margin: 1.5em;
        box-shadow: 0 10px 10px rgba(0,0,0,0.3), inset 0 2px 3px rgba(0,0,0,0.4);
    }
    .rotor {
        position: relative;
        z-index: 2;
        width: 40px;
        height: 40px;
    }
    .indicator {
        display: inline-block;
        width: 2px;
        height: 50%;
        background-color: black;
    }
    .tick {
        display: inline-block;
        width: 1px;
        height: 4px;
        background-color: ${e.foregroundColor};
    }
    .label {
        color: ${e.foregroundColor};
        font-size: 80%;
    }
    .label img, .label svg {
        width: 10px;
        height: 10px;
        fill: ${e.foregroundColor};
    }
</style>
<div class="rotary-switch">
    <div class="title">${e.title}</div>
    
    <div class="rotor-container">
        <div class="rotor">
            <div class="indicator"></div>
        </div>
    </div>
</div>
    `;constructor(){super()}connectedCallback(){super.connectedCallback(),this._minAngle=(this._props.labels===LABELS_RIGHT?1.2:.2)*Math.PI,this._maxAngle=(this._props.labels===LABELS_LEFT?.8:1.8)*Math.PI,this._selectedIndex=0,this._options=Array.from(this.querySelectorAll("option")).map((e,t)=>(e.selected&&(this._selectedIndex=t),{label:e.innerHTML,value:this._props.numeric?Number(e.value):e.value,style:e.style})),this._defaultIndex=this._selectedIndex;var e={...this._props,foregroundColor:getComputedStyle(this).getPropertyValue("color")};this._root.innerHTML=RotarySwitch.template(e),this._drawScale(),this._updateView(),this._addControlListeners()}_updateView(){this._root.querySelector(".rotor").style.transform=`rotate(${this._options[this._selectedIndex].angle+Math.PI}rad)`}_drawScale(){var e=this._root.querySelector(".rotor-container");let o=e.offsetWidth/2,i={x:e.offsetLeft+o,y:e.offsetTop+o},s=10+o,a=(this._maxAngle-this._minAngle)/(this._options.length-1),n=this._minAngle,r=this._root.querySelector(".rotary-switch");this._options.forEach(e=>{e.angle=n;var t=document.createElement("div"),t=(t.classList.add("tick"),r.append(t),t.style.position="absolute",t.style.top=i.y+Math.cos(n)*o+"px",t.style.left=i.x-Math.sin(n)*o+"px",t.style.transform=`translate(-50%, -50%) rotate(${n}rad)`,document.createElement("div")),e=(t.classList.add("label"),t.innerHTML=e.label,r.append(t),t.style.position="absolute",t.style.top=i.y+Math.cos(n)*s+"px",t.style.left=i.x-Math.sin(n)*s+"px",e.style.textAlign?{right:"-100%",left:"-4px",center:"-50%"}[e.style.textAlign]:{[LABELS_LEFT]:"-100%",[LABELS_RIGHT]:"-4px",[LABELS_AROUND]:"-50%"}[this._props.labels]);t.style.transform=`translate(${e}, -50%)`,n+=a})}_addControlListeners(){var{}=this._props,e=this._root.querySelector(".rotor");let o;addTwiddling(e).onStart(()=>{o=this._selectedIndex}).onTwiddle((e,t)=>{t=o-Math.round((t*(this._props.labels===LABELS_RIGHT?-1:1)-e)/20);(t=Math.max(0,Math.min(this._options.length-1,t)))!==this._selectedIndex&&(this._selectedIndex=t,this._updateView(),this.dispatchChangeEvent())}).onDoubleTap(()=>{this._selectedIndex=this._defaultIndex,this._updateView(),this.dispatchChangeEvent()})}get value(){return this._options[this._selectedIndex].value}set value(t){var e=this._options.find(e=>e.value===t);this._selectedIndex=this._options.indexOf(e),this._updateView()}}customElements.define("rotary-switch",RotarySwitch);let SVG="./media/svg";function getSvgUsingHref(e,t="shape"){return`<svg><use href="${SVG}/${e}.svg#${t}" width="100%" height="100%"/></svg>`}let oscTemplate=e=>`
<div class="control-group">
    <div class="vertical-group">
    <rotary-switch module-id="osc${e}" parameter-name="waveform" title="Waveform" labels="right">
        <option value="sine">${getSvgUsingHref("sine-wave")}</option>
        <option value="triangle" selected>${getSvgUsingHref("triangle")}</option>
        <option value="sawtooth">${getSvgUsingHref("saw-tooth")}</option>
        <option value="square">${getSvgUsingHref("square-wave")}</option>   
    </rotary-switch>
    <rotary-switch module-id="osc${e}" parameter-name="range" numeric title="Range" labels="right">
        <option value="2">2</option>
        <option value="1">4</option>
        <option value="0" selected>8</option>
        <option value="-1">16</option>
        <option value="-2">32</option>
    </rotary-switch>
    </div>
    <div class="vertical-group">
    <rotary-switch module-id="osc${e}" parameter-name="tune" numeric title="Semitones">
        <option value="-7">&minus;7</option>
        <option value="-6"></option>
        <option value="-5"></option>
        <option value="-4"></option>
        <option value="-3"></option>
        <option value="-2"></option>
        <option value="-1"></option>
        <option value="0" selected>0</option>
        <option value="1"></option>
        <option value="2"></option>
        <option value="3"></option>
        <option value="4"></option>
        <option value="5"></option>
        <option value="6"></option>
        <option value="7">+7</option>
    </rotary-switch>
    <rotary-knob module-id="osc${e}" parameter-name="fineTune" min-value="-50" max-value="50" scale-min="-0.5" scale-max="0.5" scale-step="0.1" minimal>Fine Tune</rotary-knob>
    </div>
    <div class="vertical-group">
        <rotary-knob module-id="osc${e}" parameter-name="modAmount" min-value="-100" max-value="100" scale-min="-5" scale-max="5" scale-step="1" minimal>Modulation</rotary-knob>
        ${2===e?`<rotary-knob module-id="osc${e}" parameter-name="crossModAmount" min-value="0" max-value="2500" scale-min="0" scale-max="10" scale-step="1">Cross-Mod</rotary-knob>`:'<rotary-knob module-id="noiseLevel1" parameter-name="level" min-value="0" max-value="0.1" scale-min="0" scale-max="10" scale-step="1">Noise</rotary-knob>'}
    </div>
    <div class="vertical-group">
        <rotary-knob module-id="oscLevel${e}" parameter-name="level" value="0.05" max-value="0.1" scale-min="0" scale-max="10" scale-step="1">Level</rotary-knob>
        ${2===e?"":`<cycle-switch module-id="noise" parameter-name="type" title="Noise Type">
            <option value="white" selected>WHITE</option>
            <option value="pink">PINK</option>
            <option value="brown">BROWN</option>
        </cycle-switch>`}
    </div>
</div>
`,lfoTemplate=`
<div class="control-group">
    <div class="vertical-group">
        <rotary-switch module-id="lfo" parameter-name="waveform" title="Waveform">
            <option value="sine">${getSvgUsingHref("sine-wave")}</option>
            <option value="triangle" selected>${getSvgUsingHref("triangle")}</option>
            <option value="sawtooth">${getSvgUsingHref("saw-tooth")}</option>
            <option value="inverse-sawtooth">${getSvgUsingHref("reverse-saw")}</option>
            <option value="square">${getSvgUsingHref("square-wave")}</option>
            <option value="sample-hold">${getSvgUsingHref("sample-and-hold")}</option>
            <option value="noise">${getSvgUsingHref("noise")}</option>
        </rotary-switch>
        <rotary-knob module-id="lfo" parameter-name="frequency" value="6" logarithmic min-value="0.1" max-value="100">Rate</rotary-knob>
    </div>
    <div class="vertical-group">
        <rotary-knob module-id="lfo" parameter-name="modWheelAmount" value="0.1" max-value="1">Mod Wheel</rotary-knob>
        <rotary-knob module-id="lfo" parameter-name="delay" value="1" logarithmic max-value="10">Delay</rotary-knob>
    </div>
    <div class="vertical-group">
        <rotary-knob module-id="lfo" parameter-name="fixedAmount" value="0.1" max-value="1">Level</rotary-knob>
        <rotary-knob module-id="lfo" parameter-name="expression" value="0" max-value="1">Expression</rotary-knob>
    </div>
</div>
`,filterTemplate=`
<div class="control-group">
    <div class="vertical-group">
    <cycle-switch module-id="filter" parameter-name="type" title="Pass">
        <option value="lowpass" selected>LOW</option>
        <option value="bandpass">BAND</option>
        <option value="highpass">HIGH</option>
    </cycle-switch>
    <cycle-switch module-id="filter" parameter-name="rolloff" numeric title="Rolloff/oct">
        <option value="12" selected>12dB</option>
        <option value="24">24dB</option>    
    </cycle-switch>
    <rotary-knob module-id="filter" parameter-name="frequency" value="500" logarithmic min-value="4.5" max-value="5000">Cut-off</rotary-knob>
    </div>
    <div class="vertical-group">
    <rotary-knob module-id="filter" parameter-name="resonance" max-value="20">Resonance</rotary-knob>
    <rotary-knob module-id="filter" parameter-name="envelopeAmount" value="5000" max-value="10000">Envelope</rotary-knob>
    </div>
    <div class="vertical-group">
    <rotary-knob module-id="filter" parameter-name="modAmount" max-value="10000">Modulation</rotary-knob>
    <rotary-knob module-id="filter" parameter-name="keyboardFollowAmount">Follow Keys</rotary-knob>
    </div>
</div>
`,globalTemplate=`
<div class="control-group">
    <div class="vertical-group">
        <rotary-switch module-id="voiceAllocator" parameter-name="numberOfVoices" numeric title="Voices">
            <option value="0">LEG.</option>
            <option value="1" selected>1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="8">8</option>
            <option value="16">16</option>
        </rotary-switch>
        <rotary-knob module-id="voiceAllocator" parameter-name="glideTime" logarithmic max-value="10">Glide Time</rotary-knob>
    </div>
    <div class="vertical-group">
        <rotary-knob module-id="transient" parameter-name="masterVolume" value="1" max-value="1">Master Volume</rotary-knob>
        <cycle-switch module-id="voiceAllocator" parameter-name="glideType" title="Glide Type">
            <option value="off" selected>OFF</option>
            <option value="always">ALL</option>
            <option value="legato">LEGATO</option>
        </cycle-switch>
        <toggle-switch module-id="global" parameter-name="envelopeStretch">Env. Stretch</toggle-switch>
    </div>
</div>
`;class VerticalSlider extends AbstractComponent{static propTypes={...AbstractComponent.propTypes,scaleMin:PropTypes.number.default(0),scaleMax:PropTypes.number.default(10),scaleStep:PropTypes.number.default(1),minimal:PropTypes.bool.default(!1),value:PropTypes.number.default(0).observed,minValue:PropTypes.number.default(0),maxValue:PropTypes.number.default(1),logarithmic:PropTypes.bool.default(!1),units:PropTypes.string.default(""),capColor:PropTypes.string.default(getThemeProps("normal-color")).observed};static template=e=>`
<style>
    .vertical-slider {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-items: center;
        position: relative;
    }
    .title {
        color: ${e.foregroundColor};
        text-align: center;
        margin-bottom: 0.5em;
    }
    .slider {
        position: relative;
        width: 50px;
        height: 170px;
        text-align: center;
    }
    .track {
        display: inline-block;
        width: 6px;
        height: 100%;
        border-radius: 3px;
        background-color: black;
    }
    .knob {
        box-sizing: border-box;
        position: absolute;
        z-index: 10;
        width: 30px;
        height: 40px;
        border: 4px solid black;
        border-width: 0 4px 0 4px;
        border-radius: 4px;
        left: 50%;
        background: linear-gradient(
            rgba(255,255,255,0.5),  
            rgba(255,255,255,0.5) 10%,
            rgba(0,0,0,0.3) 11%,
            rgba(0,0,0,0) 49%,
            rgba(255,255,255,0) 10%,
            rgba(255,255,255,0.3) 89%,
            rgba(0,0,0,0.5) 90%,
            rgba(0,0,0,0.5)
        ), ${e.capColor};
        transform: translate(-50%, -50%);
        box-shadow: 0 7px 7px rgba(0,0,0,0.4);
    }
    .indicator {
        position: absolute;
        display: inline-block;
        width: 100%;
        height: 2px;
        top: 50%;
        left: 0;
        transform: translateY(-50%);
        background-color: black;
    }
    .tick {
        position: absolute;
        display: inline-block;
        width: 4px;
        height: 1px;
        left: 38px;
        background-color: ${e.foregroundColor};
    }
    .label {
        color: ${e.foregroundColor};
        position: absolute;
        left: 44px;
        font-size: 80%;
        transform: translate(0, -50%);
    }
</style>
<div class="vertical-slider">
    <div class="title">${e.title}</div>
    <div class="slider">
        <div class="track"></div>
        <div class="knob">
            <div class="indicator"></div>
        </div>
    </div>
</div>
    `;constructor(){super()}connectedCallback(){super.connectedCallback(),this._title=this.innerHTML,this._minY=20,this._maxY=150,this._knobY=this._maxY;let{minValue:t,maxValue:o,logarithmic:e}=this._props;e?0===t?(this._toRatio=AbstractComponent.logToLinear(o,1),this._fromRatio=AbstractComponent.linearToLog(1,o)):(this._toRatio=AbstractComponent.logRangeToLinear(t,o,1),this._fromRatio=AbstractComponent.linearToLogRange(1,t,o)):(this._toRatio=e=>(e-t)/(o-t),this._fromRatio=e=>t+e*(o-t));var i={...this._props,title:this._title,foregroundColor:getComputedStyle(this).getPropertyValue("color")};this._initialValue=i.value,this._root.innerHTML=VerticalSlider.template(i),this._drawScale(),this._updateView(),this._addControlListeners()}_updateView(){this._root.querySelector(".knob").style.top=this._knobY+"px"}_drawScale(){var{scaleMin:t,scaleMax:o,scaleStep:i}=this._props,s=(this._maxY-this._minY)*i/(o-t);let a=this._maxY;var n=this._root.querySelector(".slider");for(let e=t;e<=o;e+=i){var r=document.createElement("div"),r=(r.classList.add("tick"),n.append(r),r.style.top=a+"px",Math.round(100*e)/100),l=document.createElement("div");l.classList.add("label"),this._props.minimal&&0!=r?e===t?l.innerHTML=String(r).replace(/-/,"&minus;"):e===o&&(l.innerHTML="+"+r):l.innerHTML=r,n.append(l),l.style.top=a+"px",a-=s}}_addControlListeners(){var{}=this._props,e=this._root.querySelector(".knob");let o;addTwiddling(e).onStart(()=>{o=this._knobY}).onTwiddle((e,t)=>{this._knobY=o+t,this._knobY=Math.max(Math.min(this._knobY,this._maxY),this._minY),this._updateView(),this.dispatchChangeEvent()}).onDoubleTap(()=>{this.value=this._initialValue,this.dispatchChangeEvent()})}get value(){var e=(this._maxY-this._knobY)/(this._maxY-this._minY);return this._fromRatio(e)}set value(e){e=Number(e),e=this._toRatio(e);this._knobY=this._maxY-e*(this._maxY-this._minY),this._updateView()}}customElements.define("vertical-slider",VerticalSlider);let ADSRTemplate=e=>`
<div class="control-group">
    <vertical-slider module-id="${e}" parameter-name="attackSeconds" logarithmic max-value="10">Attack</vertical-slider>
    <vertical-slider module-id="${e}" parameter-name="decaySeconds" logarithmic max-value="10">Decay</vertical-slider>
    <vertical-slider module-id="${e}" parameter-name="sustainLevel" value="1" max-value="1">Sustain</vertical-slider>
    <vertical-slider module-id="${e}" parameter-name="releaseSeconds" logarithmic max-value="10">Release</vertical-slider>
    <div class="vertical-group">
        <rotary-knob module-id="${e}" parameter-name="velocityAmount" value="0.5" max-value="1">Velocity</rotary-knob>
        <rotary-knob module-id="${e}" parameter-name="expression" value="0" max-value="1">Expression</rotary-knob>
    </div>
</div>
`,phaserTemplate=`
<div class="effect-group" data-module="phaser">
    <div class="vertical-group">
        <toggle-switch module-id="phaser" parameter-name="power" style="font-weight: bold">PHASER</toggle-switch>
    </div>
    <rotary-knob module-id="phaser" parameter-name="mix" value="0.5">Mix</rotary-knob>
    <rotary-knob module-id="phaser" parameter-name="rate" min-value="0.02" max-value="10" logarithmic>Rate</rotary-knob>
    <rotary-knob module-id="phaser" parameter-name="depth" logarithmic>Depth</rotary-knob>
    <rotary-knob module-id="phaser" parameter-name="resonance">Resonance</rotary-knob>
    <rotary-knob module-id="phaser" parameter-name="delay">Delay</rotary-knob>
</div>
`,delayTemplate=`
<div class="effect-group" data-module="delay">
    <div class="vertical-group">
        <toggle-switch module-id="delay" parameter-name="power" style="font-weight: bold">DELAY</toggle-switch>
    </div>
    <rotary-knob module-id="delay" parameter-name="mix" value="0.5">Mix</rotary-knob>
    <rotary-knob module-id="delay" parameter-name="time" logarithmic>Time</rotary-knob>
    <rotary-knob module-id="delay" parameter-name="feedback">Feedback</rotary-knob>
    <rotary-knob module-id="delay" parameter-name="spread" minimal min-value="-1" max-value="1" value="0" scale-min="-5" scale-max="5" scale-min-label="L" scale-max-label="R">Spread</rotary-knob>
</div>
`,reverbTemplate=`
<div class="effect-group" data-module="reverb">
    <div class="vertical-group">
        <toggle-switch module-id="reverb" parameter-name="power" style="font-weight: bold">REVERB</toggle-switch>
    </div>
    <rotary-knob module-id="reverb" parameter-name="mix" value="0.5">Mix</rotary-knob>
    <rotary-switch module-id="reverb" parameter-name="type" title="Room Size" labels="right">
        <option value="small" selected>SMALL</option>
        <option value="medium">MEDIUM</option>
        <option value="large">LARGE</option>
        <option value="huge">HUGE</option>
    </rotary-switch>
</div>
`,levelsTemplate=`
<div class="effect-group" data-module="levels">
    <div class="vertical-group">
        <toggle-switch module-id="levels" parameter-name="power" style="font-weight: bold">LEVELS</toggle-switch>
    </div>
    <rotary-knob module-id="levels" parameter-name="bass" value="0" min-value="-1" scale-min="-5" scale-max="5" minimal>Bass</rotary-knob>
    <rotary-knob module-id="levels" parameter-name="treble" value="0" min-value="-1" scale-min="-5" scale-max="5" minimal>Treble</rotary-knob>
    <rotary-knob module-id="levels" parameter-name="master" value="0.5">Patch Volume</rotary-knob>
</div>
`,template=()=>`
<div class="synth">
    <div class="header">
        <span id="preset-name" data-module="header" data-control="library"></span> <input id="load-patch-input" type="file" accept=".json," style="display: none"></input><button id="load-patch" data-module="header" data-control="loadPatch">Load patch</button> <button id="save-patch" data-module="header" data-control="savePatch">Save patch</button> <button id="share-patch" data-module="header" data-control="sharePatch">Share patch</button>
        <toggle-switch id="show-effects" format="horizontal" on-text="EFFECTS" off-text="EFFECTS"></toggle-switch>
        <toggle-switch id="reference-tone" format="horizontal" on-text="MIDDLE C" off-text="MIDDLE C" data-module="header" data-control="c4Tone"></toggle-switch>
        <toggle-switch id="help-mode" format="horizontal" on-text="HELP MODE" off-text="HELP MODE" cap-color="lightgreen"></toggle-switch>
        <toggle-switch id="power" format="horizontal" cap-color="orangered" on-text="POWER" off-text="POWER" checked></toggle-switch>
    </div>
    <div class="controls">
        <div class="expression-controls" data-module="expressionControls">
            <div class="panel">
                <h2>&nbsp;</h2>
                <div id="controllers">${controllersTemplate}</div>
            </div>
        </div>
        <div class="settings">
            <div class="panel" data-module="lfo">
                <h2>LFO</h2>
                <div id="lfo">${lfoTemplate}</div>
            </div>
            <div class="panel" data-module="osc1">
                <h2>Oscillator 1</h2>
                <div id="oscillator-1">${oscTemplate(1)}</div>
            </div>
            <div class="panel" data-module="osc2">
                <h2>Oscillator 2</h2>
                <div id="oscillator-2">${oscTemplate(2)}</div>
            </div>
            <div class="panel" data-module="loudnessEnvelope">
                <h2>Amp Envelope</h2>
                <div id="loudness-envelope">${ADSRTemplate("loudnessEnvelope")}</div>
            </div>
            <div class="panel" data-module="filterEnvelope">
                <h2>Filter Envelope</h2>
                <div id="filter-envelope">${ADSRTemplate("filterEnvelope")}</div>
            </div>
            <div class="panel" data-module="filter">
                <h2>Filter</h2>
                <div id="filter">${filterTemplate}</div>
            </div>
            <div class="panel" data-module="global">
                <h2>Global</h2>
                <div id="global">${globalTemplate}</div>
            </div>           
        </div>
    </div>
    <div class="panel keyboard" data-module="keyboard">
    </div>
    <div class="overlay effects-rack" data-module="effectsRack">
        ${phaserTemplate}
        ${delayTemplate}
        ${reverbTemplate}
        ${levelsTemplate}
    </div>
</div>
`;function toDimension(e,t){return"string"==typeof(e=e||t)?e:e+"px"}class Modal{constructor(e,t){var o=toDimension(t.width,"60%"),i=toDimension(t.maxWidth,"700px");this.id=++Modal.serialNumber,this._elem=document.createElement("div"),this._elem.innerHTML=Modal.modalTemplate({id:this.id,width:o,maxWidth:i,contentHTML:e}),(t.root||document.body).append(this._elem)}remove(){this._elem.remove()}get mask(){return this._elem.querySelector(".modal-mask")}get elem(){return this._elem}static serialNumber=0;static modalTemplate=e=>`
        <style>
            .modal {
                position: fixed;
                top: 0; 
                left: 0; 
                width: 100%; 
                height: 100%; 
                background-color: rgba(0,0,0,0.3);
                pointer-events: none;
            }
            .modal-mask {
                width: 100%; 
                height: 100%;
                pointer-events: all;
            }
            .modal-content {
                position: absolute; 
                top: 50%; 
                left: 50%; 
                width: ${e.width}; 
                max-width: ${e.maxWidth}; 
                transform: translate(-50%, -50%);
                pointer-events: all;
            }
        </style>
        <div class="modal" id="modal-${e.id}">
            <div class="modal-mask"></div>
            <div class="modal-content">${e.contentHTML}</div>
        </div>`}class Dialog extends Modal{constructor(e,t={}){return super(Dialog.dialogTemplate({contentHTML:e,title:t.title||"",optionLabels:t.optionLabels||["OK"]}),t),new Promise(t=>{this.elem.querySelectorAll(".hl-dialog-options button").forEach(e=>{e.addEventListener("click",e=>{e=e.target;t({option:Number(e.value),contentElement:this.elem.querySelector(".hl-dialog-content")}),this.remove()})})})}static dialogTemplate=e=>`
        <style>
            .hl-dialog {
                background-color: #cccccc;
                padding: 0;
                overflow: hidden;
                border-radius: 1em;
                font-size: 120%;
            }
            .hl-dialog-title {
                padding: 20px;
                font-size: 150%;
                font-weight: bold;
                background: white;
            }
            .hl-dialog-content {
                padding: 20px;
            }
            .hl-dialog-options {
                padding: 20px;
                text-align: center;
            }
            .hl-dialog-options button {
                border: 1px solid black;
                border-radius: 0.5em;
                padding: 0.5em 2em;
                margin: 0 0.5em;
                color: black;
            }
            .hl-dialog-content select {
                border: 1px solid black;
                border-radius: 0.5em;
                color: black;
            }

            .hl-dialog-content label {
                display: inline-block;
                width: 100px;
                margin-right: 0.5em;
                text-align: right;
            }
            .hl-dialog-content p.centered {
                text-align: center;
            }
        </style>
        <div class="hl-dialog">
            <div class="hl-dialog-title">${e.title}</div>
            <div class="hl-dialog-content">${e.contentHTML}</div>
            <div class="hl-dialog-options">
            ${e.optionLabels.map((e,t)=>`<button value="${t}">${e}</button>`).join(" ")}
            </div>
        </div>`}class Library{constructor(){this._pathToFiles="library/",this._library=[]}set library(e){e=[...e];e.sort((e,t)=>{if(e.bank.toUpperCase()>t.bank.toUpperCase())return 1;if(e.bank.toUpperCase()===t.bank.toUpperCase()){if(e.name.toUpperCase()>t.name.toUpperCase())return 1;if(e.name.toUpperCase()===t.name.toUpperCase())return 0;if(e.name.toUpperCase()<t.name.toUpperCase())return-1}return e.bank.toUpperCase()<t.bank.toUpperCase()?-1:void 0}),this._library=e.map((e,t)=>({...e,id:t}))}getBanks(){return this._library.map(e=>e.bank).filter((e,t,o)=>e!==o[t+1])}getAllPresets(){return[...this._library]}getPresetsByBank(t){return""===t?this.getAllPresets():this._library.filter(e=>e.bank===t)}getPresetById(t){return this._library.find(e=>e.id===t)}getPresetByNameAndBank(t,o){return this._library.find(e=>e.name===t&&e.bank===o)}getPresetPathById(e){return this._pathToFiles+this.getPresetById(e).fileName}}class LibraryView extends EventTarget{constructor(e,t,o,i){super(),this.rootElement=document.getElementById(e),this.library=t,this.currentPreset=this.library.getPresetByNameAndBank(o,i)||{},this.currentPresetId=this.currentPreset.id,this.selectedBank=i,this.render(),this.rootElement.addEventListener("click",e=>this.onClick(e))}render(){this.rootElement.innerHTML=`
        <div class="library">
            <div class="banks">
                ${this.library.getBanks().map(e=>`<div class="bank ${this.selectedBank===e?"selected":""}" data-bank="${e}">${e}</div>`).join("")}
            </div>
            <div class="presets">
                ${this.library.getPresetsByBank(this.selectedBank).map(e=>`<div class="preset ${e.id===this.currentPresetId?"selected":""}" data-id="${e.id}">${e.name}</div>`).join("")}
            </div>
        </div>
        `}onClick(e){e=e.target;e.classList.contains("bank")?(this.selectedBank=e.getAttribute("data-bank"),this.render()):e.classList.contains("preset")&&(this.currentPresetId=Number(e.getAttribute("data-id")),this.render(),this.dispatchEvent(new CustomEvent("preset-selected",{detail:this.currentPresetId})))}selectPreset(e,t){this.currentPreset=this.library.getPresetByNameAndBank(e,t)||{},this.currentPresetId=this.currentPreset.id,this.selectedBank=t,this.render()}}let help={modules:{header:{template:e=>`
${e.modules.header.controls.library.html}
${e.modules.header.controls.loadPatch.html}
${e.modules.header.controls.savePatch.html}
${e.modules.header.controls.sharePatch.html}
${e.modules.header.controls.c4Tone.html}
`+e.modules.header.controls.helpMode.html,controls:{library:{html:`<h3>Current Patch and Patch Selector</h3>
<p>This shows the name of the current patch, click on it to access to a built in library of preset patches.</p>
`},loadPatch:{html:`<h3>Load Patch</h3>
<p>Use it to load a patch from your device. Patch files contain all of the settings for a particular sound, and have the extension &quot;.hspatch.json&quot;. You can save patches to your device using the Save Patch button.</p>
`},savePatch:{html:`<h3>Save Patch</h3>
<p>Use it to save the current settings to your device as a patch file. Patch files contain all of the settings for a particular sound, and have the extension &quot;.hspatch.json&quot;. You can load patches from your device using the Load Patch button.</p>
`},sharePatch:{html:`<h3>Share Patch</h3>
<p>Creates a url for you to share which encapsulates the current settings, so a friend can experience the cool sound you just made.</p>
`},c4Tone:{html:`<h3>Middle C</h3>
<p>Plays a middle C refence tone which is useful when you are creating sounds using the Cross-Mod control in Oscillator 2. This can skew the frequency of the note considerably, and you will need to fiddle with the Semitones and Fine Tune controls in the Oscillators to bring it back. The note marked in yellow on the keyboard with a figure 4 in it should be in tune with this reference tone.</p>
`},helpMode:{html:`<h3>Help Mode</h3>
<p>When Help Mode is on, click on any control or panel to get an explanation of its function. You can keep clicking on other items for more help, until Help Mode is turned off by clicking the HELP MODE button again.</p>
`}}},expressionControls:{template:e=>`<h2>Expression Controls</h2>
<p>These controls are designed for use while playing to add expression to your performance, their positions are not saved in patches.</p>

${e.modules.expressionControls.controls.pitchBend.html}
`+e.modules.expressionControls.controls.modWheel.html,controls:{pitchBend:{html:`<h3>Pitch Bend</h3>
<p>Drag up or down to increase or decrease the pitch of the note by two semitones. If you release the control, it will snap back to the original note.</p>
`},modWheel:{html:`<h3>Modulation Wheel</h3>
<p>Use this to control how much of the LFO signal is used to modulate the sound. See the Mod Wheel control in the LFO section, the Modulation controls in the Oscillator sections, and the Modulation control in the Filter section for details on how this can be configured to affect the sound.</p>
`}}},lfo:{template:e=>`<h2>LFO (Low Frequency Oscillator)</h2>
<p>Used to modulate the Oscillators’ frequencies and the cut-off frequency of the Filter, to create vibrato effects or slow sweeping timbre changes. The Mod Wheel (left) can be used to adjust the amount of modulation, and a fixed amount can be set which can be made to come in gradually after a delay when a note is played, adding an expressive quality. Further expressiveness can be added by making this delay shorter the harder you press the note.</p>
<p>White, pink or brown noise can be used to modulate, which gives ragged or glitchy effects, especially with brown noise set by the Noise Type selector in Oscillator 1.</p>

${e.modules.lfo.controls.waveform.html}
${e.modules.lfo.controls.frequency.html}
${e.modules.lfo.controls.modWheelAmount.html}
${e.modules.lfo.controls.delay.html}
${e.modules.lfo.controls.fixedAmount.html}
`+e.modules.lfo.controls.expression.html,controls:{waveform:{html:`<h3>Waveform</h3>
<p>The type of signal used for modulation.</p>
<table>
<thead>
<tr>
<th>option</th>
<th>description</th>
</tr>
</thead>
<tbody>
<tr>
<td><img src="media/svg/sine-wave.svg" alt="Sine wave"></td>
<td>Sine wave</td>
</tr>
<tr>
<td><img src="media/svg/triangle.svg" alt="Triangle wave"></td>
<td>Triangle wave</td>
</tr>
<tr>
<td><img src="media/svg/saw-tooth.svg" alt="Ramp-up"></td>
<td>Ramp-up sawtooth</td>
</tr>
<tr>
<td><img src="media/svg/reverse-saw.svg" alt="Ramp-down"></td>
<td>Ramp-down sawtooth</td>
</tr>
<tr>
<td><img src="media/svg/square-wave.svg" alt="Square wave"></td>
<td>Square wave</td>
</tr>
<tr>
<td><img src="media/svg/sample-and-hold.svg" alt="Sample and hold"></td>
<td>Sample and hold (random stepped wave)</td>
</tr>
<tr>
<td><img src="media/svg/noise.svg" alt="Noise"></td>
<td>Noise, type determined by Noise Type selector in Oscillator 1 (note the Rate control has no effect here)</td>
</tr>
</tbody>
</table>
`},frequency:{html:`<h3>Rate or Frequency</h3>
<p>The rate of the modulating wave, or the sample rate in the case of sample and hold. Has no effect when noise is selected.</p>
`},modWheelAmount:{html:`<h3>Mod Wheel Amount</h3>
<p>Controls the maximum modulation introduced by the Mod Wheel. Is applied on top of the Level control.</p>
`},delay:{html:`<h3>Delay</h3>
<p>Controls the delay before the modulation set by the Level control kicks in, zero = no delay. Can be combined with the Expression control to make the delay velocity sensitive.</p>
`},fixedAmount:{html:`<h3>Level</h3>
<p>The minimum amount of modulation when Mod Wheel is on minimum. Works in conjunction with the Delay and Expression controls.</p>
`},expression:{html:`<h3>Expression</h3>
<p>Adds more modulation when keys are pressed harder. When the Delay control is non-zero, it also shortens the delay when keys are pressed harder.</p>
`}}},osc1:{template:e=>`<h2>Oscillator 1</h2>
<p>The two Oscillators generate tones which are the basis of the sounds generated by the instrument. A range of different timbres can be created by mixing different waveforms with different frequency offsets, with more extreme sounds possible using the Cross-Mod control in Oscillator 2.</p>

${e.modules.osc1.controls.waveform.html}
${e.modules.osc1.controls.range.html}
${e.modules.osc1.controls.tune.html}
${e.modules.osc1.controls.fineTune.html}
${e.modules.osc1.controls.modAmount.html}
${e.modules.noiseLevel1.controls.level.html}
${e.modules.oscLevel1.controls.level.html}
`+e.modules.noise.controls.type.html,controls:{waveform:{html:`<h3>Waveform</h3>
<p>The type of signal generated by the oscillator.</p>
<table>
<thead>
<tr>
<th>option</th>
<th>description</th>
</tr>
</thead>
<tbody>
<tr>
<td><img src="media/svg/sine-wave.svg" alt="Sine wave"></td>
<td>Sine wave</td>
</tr>
<tr>
<td><img src="media/svg/triangle.svg" alt="Triangle wave"></td>
<td>Triangle wave</td>
</tr>
<tr>
<td><img src="media/svg/saw-tooth.svg" alt="Ramp-up"></td>
<td>Sawtooth wave</td>
</tr>
<tr>
<td><img src="media/svg/square-wave.svg" alt="Square wave"></td>
<td>Square wave</td>
</tr>
</tbody>
</table>
`},range:{html:`<h3>Range</h3>
<p>The octave range of the frequencies, broadly in feet as in organ stops, although this is just a guide. Higher numbers give lower tones.</p>
`},tune:{html:`<h3>Semitones</h3>
<p>Adjusts the frequency offset by plus or minus fixed semitones.</p>
`},fineTune:{html:`<h3>Fine Tune</h3>
<p>Allows fine tuning of the frequency offset by up to plus or minus a semitone. Useful for creating detune effects, where the oscillators are slightly out of tune giving depth and movement to the sound.</p>
`},modAmount:{html:`<h3>Modulation</h3>
<p>Controls the amount of frequency modulation applied using the LFO. A negative amount causes the reverse effect, i.e. the frequency is raised when it would have been lowered if a positive amount had been set.</p>
`}}},noiseLevel1:{controls:{level:{html:`<h3>Noise</h3>
<p>Controls the amount of noise mixed into the sound, for creating breathy effects. The type of noise is set using the Noise Type selector.</p>
`}}},oscLevel1:{controls:{level:{html:`<h3>Level</h3>
<p>Controls the amount of Oscillator 1 signal in the mix.</p>
`}}},noise:{controls:{type:{html:`<h3>Noise Type</h3>
<p>The type of noise generated by the global noise source. This is also used in the LFO.</p>
<table>
<thead>
<tr>
<th>option</th>
<th>description</th>
</tr>
</thead>
<tbody>
<tr>
<td>WHITE</td>
<td>A noise with an even spread of frequencies.</td>
</tr>
<tr>
<td>PINK</td>
<td>A less harsh noise.</td>
</tr>
<tr>
<td>BROWN</td>
<td>Has more in the lower frequencies, good for use as a modulator to give raggedy effects.</td>
</tr>
</tbody>
</table>
`}}},osc2:{template:e=>`<h2>Oscillator 2</h2>
<p>The two Oscillators generate tones which are the basis of the sounds generated by the instrument. A range of different timbres can be created by mixing different waveforms with different frequency offsets, with more extreme sounds possible using the Cross-Mod control in Oscillator 2.</p>

${e.modules.osc2.controls.waveform.html}
${e.modules.osc2.controls.range.html}
${e.modules.osc2.controls.tune.html}
${e.modules.osc2.controls.fineTune.html}
${e.modules.osc2.controls.modAmount.html}
${e.modules.osc2.controls.crossModAmount.html}
`+e.modules.oscLevel2.controls.level.html,controls:{waveform:{html:`<h3>Waveform</h3>
<p>The type of signal generated by the oscillator.</p>
<table>
<thead>
<tr>
<th>option</th>
<th>description</th>
</tr>
</thead>
<tbody>
<tr>
<td><img src="media/svg/sine-wave.svg" alt="Sine wave"></td>
<td>Sine wave</td>
</tr>
<tr>
<td><img src="media/svg/triangle.svg" alt="Triangle wave"></td>
<td>Triangle wave</td>
</tr>
<tr>
<td><img src="media/svg/saw-tooth.svg" alt="Ramp-up"></td>
<td>Sawtooth wave</td>
</tr>
<tr>
<td><img src="media/svg/square-wave.svg" alt="Square wave"></td>
<td>Square wave</td>
</tr>
</tbody>
</table>
`},range:{html:`<h3>Range</h3>
<p>The octave range of the frequencies, broadly in feet as in organ stops, although this is just a guide. Higher numbers give lower tones.</p>
`},tune:{html:`<h3>Semitones</h3>
<p>Adjusts the frequency offset by plus or minus fixed semitones.</p>
`},fineTune:{html:`<h3>Fine Tune</h3>
<p>Allows fine tuning of the frequency offset by up to plus or minus a semitone. Useful for creating detune effects, where the oscillators are slightly out of tune giving depth and movement to the sound.</p>
`},modAmount:{html:`<h3>Modulation</h3>
<p>Controls the amount of frequency modulation applied using the LFO. A negative amount causes the reverse effect, i.e. the frequency is raised when it would have been lowered if a positive amount had been set.</p>
`},crossModAmount:{html:`<h3>Cross-Modulation</h3>
<p>This frequency-modulates the Oscillator 2 signal using the signal from Oscillator 1. This introduces some complexity to the waveform, and can create some beautiful bell like effects similar to those created by FM synthesisers. It can also create some extremely ugly noises! As a guide, begin experimenting with sine waves or triangular waves, and bear in mind that it can throw the tuning way out, so you may need to fiddle with the frequency offsets of the two Oscillators, i.e. Semitones and Fine Tune, to get the instrument back in tune. There is a middle C tone generator above to help you with that.</p>
`}}},oscLevel2:{controls:{level:{html:`<h3>Level</h3>
<p>Controls the amount of Oscillator 2 signal in the mix.</p>
`}}},loudnessEnvelope:{template:e=>`<h2>Amp Envelope</h2>
<p>This envelope shapes how the loudness of the note changes with time after a key press.</p>
<p>When a key is pressed the envelope rises linearly to its maximum level in the time set by Attack, then decays exponentially to the Sustain level in the time set by Decay. When the key is released, the envelope reduces exponentially to zero in the time set by Release. Velocity allows expression by making the envelope levels proportional to how hard the key is pressed. The Expression control adds further expression by shortening the Attack time the harder the key is pressed.</p>

${e.modules.loudnessEnvelope.controls.attackSeconds.html}
${e.modules.loudnessEnvelope.controls.decaySeconds.html}
${e.modules.loudnessEnvelope.controls.sustainLevel.html}
${e.modules.loudnessEnvelope.controls.releaseSeconds.html}
${e.modules.loudnessEnvelope.controls.velocityAmount.html}
`+e.modules.loudnessEnvelope.controls.expression.html,controls:{attackSeconds:{html:`<h3>Attack</h3>
<p>The time taken for the envelope to rise linearly to it’s maximum level. The Expression control can also affect this by shortening it when the key is pressed harder.</p>
`},decaySeconds:{html:`<h3>Decay</h3>
<p>The time taken for the envelope to fall exponentially from its maximum value to the sustain value.</p>
`},sustainLevel:{html:`<h3>Sustain</h3>
<p>The level to which the envelope falls and sustains until the key is released.</p>
`},releaseSeconds:{html:`<h3>Release</h3>
<p>The time take for the envelope to fall exponentially to zero when the key is released.</p>
`},velocityAmount:{html:`<h3>Velocity</h3>
<p>When zero, the envelope is fixed; when turned up, the maximum and sustain levels increase with how hard the key is pressed.</p>
`},expression:{html:`<h3>Expression</h3>
<p>When turned up, the attack time is shortened when the key is pressed harder. This allows for more distinct expressiveness.</p>
`}}},filterEnvelope:{template:e=>`<h2>Filter Envelope</h2>
<p>This envelope affects how the cut-off frequency of the Filter module changes over time after a key press, and the amount of effect it has can be controlled using the Filter&gt;Envelope control.</p>
<p>When a key is pressed the envelope rises linearly to its maximum level in the time set by Attack, then decays exponentially to the Sustain level in the time set by Decay. When the key is released, the envelope reduces exponentially to zero in the time set by Release. Velocity allows expression by making the envelope levels proportional to how hard the key is pressed. The Expression control adds further expression by shortening the Attack time the harder the key is pressed.</p>

${e.modules.filterEnvelope.controls.attackSeconds.html}
${e.modules.filterEnvelope.controls.decaySeconds.html}
${e.modules.filterEnvelope.controls.sustainLevel.html}
${e.modules.filterEnvelope.controls.releaseSeconds.html}
${e.modules.filterEnvelope.controls.velocityAmount.html}
`+e.modules.filterEnvelope.controls.expression.html,controls:{attackSeconds:{html:`<h3>Attack</h3>
<p>The time taken for the envelope to rise linearly to it’s maximum level. The Expression control can also affect this by shortening it when the key is pressed harder.</p>
`},decaySeconds:{html:`<h3>Decay</h3>
<p>The time taken for the envelope to fall exponentially from its maximum value to the sustain value.</p>
`},sustainLevel:{html:`<h3>Sustain</h3>
<p>The level to which the envelope falls and sustains until the key is released.</p>
`},releaseSeconds:{html:`<h3>Release</h3>
<p>The time take for the envelope to fall exponentially to zero when the key is released.</p>
`},velocityAmount:{html:`<h3>Velocity</h3>
<p>When zero, the envelope is fixed; when turned up, the maximum and sustain levels increase with how hard the key is pressed.</p>
`},expression:{html:`<h3>Expression</h3>
<p>When turned up, the attack time is shortened when the key is pressed harder. This allows for more distinct expressiveness.</p>
`}}},filter:{template:e=>`<h2>Filter</h2>
<p>The filter shapes the sound by reducing and boosting certain frequencies, and can be controlled by the LFO and the Filter Envelope.</p>

${e.modules.filter.controls.type.html}
${e.modules.filter.controls.rolloff.html}
${e.modules.filter.controls.frequency.html}
${e.modules.filter.controls.resonance.html}
${e.modules.filter.controls.envelopeAmount.html}
${e.modules.filter.controls.modAmount.html}
`+e.modules.filter.controls.keyboardFollowAmount.html,controls:{type:{html:`<h3>Pass</h3>
<table>
<thead>
<tr>
<th>option</th>
<th>description</th>
</tr>
</thead>
<tbody>
<tr>
<td>LOW</td>
<td>Reduces frequencies above the Cut-Off frequency</td>
</tr>
<tr>
<td>BAND</td>
<td>Reduces frequencies above and below the Cut-Off frequency. This is only effective in conjunction with the Resonance control; with that set to zero, the response is flat. The amount of fall off above and below increases with higher resonance values</td>
</tr>
<tr>
<td>HIGH</td>
<td>Reduces frequencies below the Cut-Off frequency</td>
</tr>
</tbody>
</table>
`},rolloff:{html:`<h3>Rolloff/oct</h3>
<p>This is the strength of the filter, expressed as the number of dBs reduction for every octave away from the Cut-Off frequency. Choose between 12dB/oct and 24dB/oct.</p>
`},frequency:{html:`<h3>Cut-Off</h3>
<p>The point above and/or below which frequencies are reduced, and also the frequency boosted if the Resonance control is non-zero.</p>
`},resonance:{html:`<h3>Resonance</h3>
<p>The amount of boost at the Cut-Off frequency</p>
`},envelopeAmount:{html:`<h3>Envelope</h3>
<p>The degree to which the Filter Envelope affects the Cut-Off frequency.</p>
`},modAmount:{html:`<h3>Modulation</h3>
<p>The degree to which the LFO affects the Cut-Off frequency.</p>
`},keyboardFollowAmount:{html:`<h3>Follow Keys</h3>
<p>The degree to which the Cut-Off frequency follows the pitch of the note played. When at maximum, it follows it exactly, allowing musical notes to be made from a noise only source using a high Resonance value.</p>
`}}},voiceAllocator:{controls:{numberOfVoices:{html:`<h3>Voices</h3>
<p>The number of different notes that can be played at the same time. When set to 1 or LEG. (legato), it behaves as a monophonic instrument. Legato causes the envelopes to continue on to the next note without triggering the attack phase, if played without releasing the previous one. 1 causes a new attack phase for each note change.</p>
`},glideTime:{html:`<h3>Glide Time</h3>
<p>The time it takes to glide from one note to another when Glide Type is not OFF.</p>
`},glideType:{html:`<h3>Glide Type</h3>
<table>
<thead>
<tr>
<th>option</th>
<th>description</th>
</tr>
</thead>
<tbody>
<tr>
<td>OFF</td>
<td>The frequency jumps instantly to the next note</td>
</tr>
<tr>
<td>ALL</td>
<td>The frequency always glides from one note to the next at a rate set by Glide Time</td>
</tr>
<tr>
<td>LEGATO</td>
<td>Only notes played without releasing the previous one will glide</td>
</tr>
</tbody>
</table>
<p>Glide can be used with more than one voice, with unpredictable but sometimes pleasing results!</p>
`}}},transient:{controls:{masterVolume:{html:`<h3>Master Volume</h3>
<p>The master volume of the instrument. This is independent of the patch data and is not saved.</p>
`},velocityType:{html:`<h3>Velocity Mode</h3>
<p>Selects how the velocity of a key-press is determined when using the on-screen keyboard. When using an external keyboard, this has no effect and the actual velocity is used.</p>
<table>
<thead>
<tr>
<th>Option</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>TOUCH</td>
<td>(On touch devices only) the size of the touch point is used, the harder the touch, the bigger the radius.</td>
</tr>
<tr>
<td>POS'N</td>
<td>The vertical position touched or clicked on the key is used, the bottom of the key is maximum velocity.</td>
</tr>
<tr>
<td>MAX</td>
<td>The velocity is fixed at the maximum value.</td>
</tr>
<tr>
<td>70%</td>
<td>The velocity is fixed at 70 percent of the maximum value.</td>
</tr>
<tr>
<td>50%</td>
<td>...you get the gist...</td>
</tr>
<tr>
<td>30%</td>
<td>...you got it!</td>
</tr>
</tbody>
</table>
<p>Different touch devices have different sensitivities, so if you're on a touch device the size of a normal touch was detected when you clicked the big button to launch this thing (clever, eh?). Just don't hit it too hard or you'll mess up the calculation.</p>
`}}},global:{template:e=>`<h2>Global</h2>
<p>This panel contains controls that affect the whole instrument.</p>

${e.modules.voiceAllocator.controls.numberOfVoices.html}
${e.modules.voiceAllocator.controls.glideTime.html}
${e.modules.transient.controls.masterVolume.html}
${e.modules.voiceAllocator.controls.glideType.html}
`+e.modules.global.controls.envelopeStretch.html,controls:{envelopeStretch:{html:`<h3>Envelope Stretch</h3>
<p>Natural instruments like pianos have a long decay on low notes and a shorter decay on high notes. Turning Envelope Stretch on simulates this behaviour.</p>
`}}},phaser:{template:e=>`<h2>Phaser Effect</h2>
<p>The phaser gives the sound depth by adding in the original signal inverted and delayed by a variable amount. The variable amount is controlled by a sine wave low frequency oscillator, adjusted using the Rate and Depth controls.</p>

${e.modules.phaser.controls.mix.html}
${e.modules.phaser.controls.rate.html}
${e.modules.phaser.controls.depth.html}
${e.modules.phaser.controls.resonance.html}
`+e.modules.phaser.controls.delay.html,controls:{mix:{html:`<h3>Mix</h3>
<p>Controls the mix between the un-processed and processed signals.</p>
`},rate:{html:`<h3>Rate</h3>
<p>The speed of the low frequency oscillator that controls the delay.</p>
`},depth:{html:`<h3>Depth</h3>
<p>The strength of the low frequency oscillator sine wave, larger values gives more extreme results.</p>
`},resonance:{html:`<h3>Feedback</h3>
<p>Controls the amount of the processed signal that is fed back into the input, high values can give truly bonkers results!</p>
`},delay:{html:`<h3>Delay</h3>
<p>Controls how much additional delay is applied to the processed singnal. With this set to zero, the processed signal exactly cancels the un-processed signal, creating classic &quot;wind tunnel&quot; effects. For the maximum effect, set the Mix to half way (double tap it).</p>
`}}},delay:{template:e=>`<h2>Delay Effect</h2>
<p>The Delay Effect records the input signal and plays it back in real time after a delay, creating echo effects. You can feed some of the delayed signal back into the input to create a repeated echo decaying over time. You can create stereo ping-pong echos with the Spread control.</p>

${e.modules.delay.controls.mix.html}
${e.modules.delay.controls.time.html}
${e.modules.delay.controls.feedback.html}
`+e.modules.delay.controls.spread.html,controls:{mix:{html:`<h3>Mix</h3>
<p>Controls the mix between the un-processed and processed signals.</p>
`},time:{html:`<h3>Time</h3>
<p>Sets the delay time between echoes.</p>
`},feedback:{html:`<h3>Feedback</h3>
<p>Sets the amount of delayed signal to feed back into the input, giving repeated echoes. Maximum value gives 100% feedback which will never decay, use with caution!</p>
`},spread:{html:`<h3>Spread</h3>
<p>When at the centre position, the echo is monophonic. When turned to the left, the first echo is panned to the left, the second to the right, then back again and so on. When turned to the right, the first echo is on the right.</p>
`}}},reverb:{template:e=>`<h2>Reverb Effect</h2>
<p>This applies a stereo reverb effect to the signal with four different room size simulations.</p>

${e.modules.reverb.controls.mix.html}
`+e.modules.reverb.controls.type.html,controls:{mix:{html:`<h3>Mix</h3>
<p>Controls the mix between the un-processed and processed signals.</p>
`},type:{html:`<h3>Room Size</h3>
<p>Sets the quality of the reverb</p>
<table>
<thead>
<tr>
<th>option</th>
<th>description</th>
</tr>
</thead>
<tbody>
<tr>
<td>SMALL</td>
<td>Subtle effect, just adds a bit of presence</td>
</tr>
<tr>
<td>MEDIUM</td>
<td>Adds more depth, like a living room</td>
</tr>
<tr>
<td>LARGE</td>
<td>Sounds like a large hall</td>
</tr>
<tr>
<td>HUGE</td>
<td>More like a cathedral</td>
</tr>
</tbody>
</table>
`}}},levels:{template:e=>`<h2>Levels Panel</h2>
<p>Control over the tone and master volume of the signal.</p>

${e.modules.levels.controls.bass.html}
${e.modules.levels.controls.treble.html}
`+e.modules.levels.controls.master.html,controls:{bass:{html:`<h3>Bass</h3>
<p>Boosts or cuts the low frequencies.</p>
`},treble:{html:`<h3>Treble</h3>
<p>Boosts or cuts the high frequencies.</p>
`},master:{html:`<h3>Patch Volume</h3>
<p>Boosts or cuts the entire signal (saved with the patch data, unlike Master Volume in the Global section). Particularly useful when using Band Pass in the Filter section, as that can attenuate the signal quite a lot.</p>
`}}},keyboard:{template:e=>`<h2>Keyboard</h2>
<p>The on-screen keyboard is playable on both touch devices and desktop computers, although it's obviously much more fun on a touch device, when it can be used more like a physical instrument. When an external MIDI keyboard is connected, it can be used normally with full touch sensitivity, and the sustain pedal works as expected. On touch devices, the on-screen keyboard is touch sensitive based on the size of the touch area, so pressing harder gives quite usable expressiveness. When used on a desktop computer, the velocity is based on the vertical position of the cursor on the key, top of the key is soft, bottom of the key is loud. The velocity can also be set to fixed values if that's not working for you.</p>
<p>The number of keys defaults to a comfortable range for on-screen use, but other common configurations can be selected using the preset buttons to the right. The number and range of keys is also fully customisable using the Keyboard Adjuster. The location of middle C is marked in yellow, and the numbers on the C keys indicate the other octave positions.</p>
<p>The keyboard settings are independent of patch data and are not saved.</p>

${e.modules.keyboard.controls.adjuster.html}
`+e.modules.transient.controls.velocityType.html,controls:{adjuster:{html:`<h3>Keyboard Adjuster</h3>
<p>The octave range of the keyboard can be adjusted by dragging the central white area of the Keyboard Adjuster left or right. The number of keys shown can be chaged by dragging the grey areas either side left or right.</p>
`}}}}};function getHelpHtml(e,t){var o=help.modules[e],e=help.modules[e].controls[t];return void 0!==t&&e?e.html:o?o.template(help):void 0}class HelpPopup extends Modal{constructor(e,t={}){HelpPopup.currentPopup&&HelpPopup.currentPopup.close();var o=HelpPopup.dialogTemplate({contentHTML:e});t.maxWidth||(t.maxWidth=30*Math.sqrt(e.replace(/<.*?>/gs,"").length)),super(o,t),this.elem.querySelector(".modal-mask").remove(),this.elem.querySelector(".modal").style="background: transparent";let i=this.elem.querySelector(".modal-content");e=i.getBoundingClientRect(),o=t.target.getBoundingClientRect(),t=document.documentElement.getBoundingClientRect();let s=o.top,a=o.left+o.width+10,n=null,r=null;a+e.width>t.width&&(n=t.width-a)<200&&(a=o.left-e.width-10,n=null,a<0)&&(a=0,n=o.left-10);o=()=>{i.style=`transform: unset; top: ${s}px; left: ${a}px; `+(null===n?"":`width: ${n}px; `)+(null===r?"":`height: ${r}px; `)};return o(),e=i.getBoundingClientRect(),s+e.height>t.height&&(s=t.height-e.height)<0&&(s=0,r=t.height),o(),HelpPopup.currentPopup=this,new Promise(t=>{this.elem.querySelector(".hl-help-popup button.hl-help-close-button").addEventListener("click",e=>{HelpPopup.currentPopup=void 0,this.remove(),t()})})}close(){this.elem.querySelector(".hl-help-popup button.hl-help-close-button").click()}static currentPopup=void 0;static dialogTemplate=e=>`
        <style>
            .hl-help-popup {
                height: 100%;
                background-color: lightgreen;
                padding: 0;
                overflow: auto;
                border-radius: 0.5em;
                box-shadow: 0 5px 10px black;
            }
            .hl-help-content {
                padding: 1em;
            }
            .hl-help-close-button {
                position: absolute;
                top: 0.3em;
                right: 0.3em;
                border: 0;
                color: black;
                font-size: 150%;
                background: transparent;
            }
            .hl-help-popup thead {
                display: none;
            }
            .hl-help-popup td {
                vertical-align: top;
            }
            .hl-help-popup td:first-child {
                font-weight: bold;
                min-width: 2em;
                padding-right: 1em;
            }
        </style>
        <div class="hl-help-popup">
            <div class="hl-help-content">${e.contentHTML}</div>
            <button class="hl-help-close-button">&times;</button>
        </div>`}let initialPatch={global:{totalVoices:1,legato:!0,envelopeStretch:!1,name:"Too High!",bank:"Basses"},controllerHelper:{pitchBendMax:200,modulationMax:100},voiceAllocator:{numberOfVoices:0,glideTime:.019857606383389993,glideType:"always"},osc1:{waveform:"sawtooth",range:-1,tune:0,fineTune:2,modAmount:100,crossModAmount:0},osc2:{waveform:"triangle",range:-2,tune:0,fineTune:-1,modAmount:100,crossModAmount:0},oscLevel1:{level:.066},oscLevel2:{level:.048},noiseLevel1:{level:0},amplifier:{},loudnessEnvelope:{attackSeconds:0,decaySeconds:0,sustainLevel:1,releaseSeconds:0,velocityAmount:.5,expression:0},filter:{type:"lowpass",rolloff:12,frequency:69.35183155248555,resonance:6.2,modAmount:0,keyboardFollowAmount:1,envelopeAmount:4900},filterEnvelope:{attackSeconds:.05830307435355809,decaySeconds:.5348507922869201,sustainLevel:.51,releaseSeconds:0,velocityAmount:.56,expression:0},lfo:{waveform:"triangle",frequency:5.495408738576245,fixedAmount:0,modWheelAmount:.1962675373859285,delay:0,expression:0},noise:{type:"white"},delay:{power:!1,mix:.5,time:.1,feedback:.5,spread:0},reverb:{power:!0,mix:.5,type:"small",highPass:0},levels:{power:!0,bass:0,treble:.22281692032865363,master:.5},phaser:{power:!1,mix:.4363380227632418,rate:.14136569937713214,depth:.05570423008216342,resonance:.3885915398356732,delay:.031830988618379095},softKeyboard:{}},banks=["Leads","Keys","Basses","Pads","Strings","Brass","Woodwind","Plucks","FX","Percussion","Misc","Prototypes"];function iOS(){return["iPad Simulator","iPhone Simulator","iPod Simulator","iPad","iPhone","iPod"].includes(navigator.platform)||navigator.userAgent.includes("Mac")&&"ontouchend"in document}class PolySynth extends ModularSynth{constructor(e,t={}){super(),this._options=t,this._root=document.getElementById(e),this._render(),this._library=new Library,fetch("library/index.json").then(e=>{e.text().then(e=>{this._library.library=JSON.parse(e).library,this.loadPatch()})}),this.createModules(),this.connectModules(),document.getElementById("preset-name").innerHTML=this.globalPatch.get("name"),this.addEventListeners()}createModules(){this.createMidiModule(),this._transientSettings=this.createSoftKeyboardModule("transient",this._options),this._controllerHelper=this.createControllerHelperModule("controllerHelper"),this._voiceAllocator=this.createVoiceAllocatorModule("voiceAllocator"),this._osc1=this.createPolyOscillatorModule("osc1"),this._osc2=this.createPolyOscillatorModule("osc2"),this._oscLevel1=this.createPolyLevelModule("oscLevel1"),this._oscLevel2=this.createPolyLevelModule("oscLevel2"),this._noiseLevel1=this.createPolyLevelModule("noiseLevel1"),this._amplifier=this.createPolyAmpModule("amplifier"),this._loudnessEnvelope=this.createPolyEnvelopeModule("loudnessEnvelope"),this._filter=this.createPolyFilterModule("filter"),this._filterEnvelope=this.createPolyEnvelopeModule("filterEnvelope"),this._lfo=this.createLFOModule("lfo"),this._noise=this.createNoiseModule("noise"),this._delayEffect=this.createDelayEffectModule("delay"),this._reverbEffect=this.createReverbEffectModule("reverb"),this._levelsEffect=this.createLevelsEffectModule("levels"),this._phaserEffect=this.createPhaserEffectModule("phaser")}connectModules(){this._voiceAllocator.C4Offset.polyConnectTo(this._osc1.offsetCentsIn),this._voiceAllocator.C4Offset.polyConnectTo(this._osc2.offsetCentsIn),this._voiceAllocator.C4Offset.polyConnectTo(this._filter.keyboardFollowIn),this._osc1.audioOut.polyConnectTo(this._oscLevel1.audioIn),this._osc2.audioOut.polyConnectTo(this._oscLevel2.audioIn),this._osc1.offsetCentsIn.fanOutConnectFrom(this._controllerHelper.pitchBend),this._osc2.offsetCentsIn.fanOutConnectFrom(this._controllerHelper.pitchBend),this._osc1.audioOut.polyConnectTo(this._osc2.crossModulationIn),this._oscLevel1.audioOut.polyConnectTo(this._amplifier.audioIn),this._oscLevel2.audioOut.polyConnectTo(this._amplifier.audioIn),this._amplifier.modulationIn.polyConnectFrom(this._loudnessEnvelope.envelopeOut),this._amplifier.audioOut.polyConnectTo(this._filter.audioIn),this._filter.envelopeIn.polyConnectFrom(this._filterEnvelope.envelopeOut),this._lfo.lfoOut.connect(this._osc1.modulationIn),this._lfo.lfoOut.connect(this._osc2.modulationIn),this._lfo.lfoOut.connect(this._filter.modulationIn),this._filter.audioOut.fanInConnectTo(this._phaserEffect.audioIn),this._amplifier.audioIn.polyConnectFrom(this._noiseLevel1.audioOut),this._noiseLevel1.audioIn.fanOutConnectFrom(this._noise.noiseOut),this._noise.noiseOut.connect(this._lfo.noiseIn),this._phaserEffect.audioOut.connect(this._delayEffect.audioIn),this._delayEffect.audioOut.connect(this._reverbEffect.audioIn),this._reverbEffect.audioOut.connect(this._levelsEffect.audioIn),this._levelsEffect.audioOut.connect(this._transientSettings.audioIn),this._transientSettings.audioOut.connect(this.audioContext.destination)}addEventListeners(){document.getElementById("preset-name").addEventListener("click",e=>this.showLibrary(e)),document.getElementById("load-patch").addEventListener("click",()=>{document.getElementById("load-patch-input").click()}),document.getElementById("load-patch-input").addEventListener("change",e=>this.loadPatchfromFile(e)),document.getElementById("save-patch").addEventListener("click",()=>this.savePatchToFile()),document.getElementById("share-patch").addEventListener("click",()=>this.sharePatch()),document.getElementById("pitch-bend").addEventListener("input",e=>{this._controllerHelper._onPitchBend(e.target.value+64)}),document.getElementById("mod-wheel").addEventListener("input",e=>{this._controllerHelper._onModWheel(e.target.value)}),document.getElementById("show-effects").addEventListener("change",this.onShowEffectsChange),document.getElementById("help-mode").addEventListener("change",this.onHelpModeChange),document.getElementById("reference-tone").addEventListener("change",this.onReferenceToneChange),document.getElementById("power").addEventListener("change",this.onPowerSwitchChange),this._root.addEventListener("drop",e=>this.dropHandler(e)),this._root.addEventListener("dragover",e=>this.dragOverHandler(e)),this.globalPatch.addEventListener("change",()=>{document.getElementById("preset-name").innerHTML=this.globalPatch.get("name")}),window.addEventListener("unload",this.onUnload),window.addEventListener("pagehide",this.onPageHide),window.addEventListener("pageshow",this.onPageShow),window.addEventListener("blur",this.onBlur),window.addEventListener("focus",this.onFocus),document.addEventListener("visibilitychange",this.onVisibilityChange),this.eventBus.addEventListener("modwheel",e=>{document.getElementById("mod-wheel").value=e.detail.midiValue}),this.eventBus.addEventListener("pitchbend",e=>{document.getElementById("pitch-bend").value=e.detail.midiValue-64})}suspendApp(e){"running"!==this.audioContext.state||this._suspendPending||(this.savePatch(),this._suspendPending=!0,this.audioContext.suspend().then(()=>{delete this._suspendPending},()=>{delete this._suspendPending,new Dialog("Failed to suspend the audio context. Event: "+e)}))}manuallyResume(e,t){this._resumePending=!0;let o=document.createElement("div"),i=(o.style="position: fixed; z-index: 999999; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: rgba(0,0,0,0.5)",document.body.append(o),o.innerHTML='<div style="display: inline-block; font-family: sans-serif; font-size: 50px; font-weight: bold; color: white">CLICK TO RESUME</div>',e=>{o.removeEventListener("mousedown",i),o.remove(),this.audioContext.resume(),delete this._resumePending});o.addEventListener("mousedown",i)}resumeApp(e){this._resumePending||"running"===this.audioContext.state||("interrupted"===this.audioContext.state||iOS()?this.manuallyResume(e):(this._resumePending=!0,this.audioContext.resume().then(()=>{delete this._resumePending},()=>{this.manuallyResume(e,!0)})))}onUnload=e=>{this.suspendApp(e.type)};onPageHide=e=>{this.suspendApp(e.type)};onPageShow=e=>{this.resumeApp(e.type)};onBlur=e=>{this.suspendApp(e.type)};onFocus=e=>{this.resumeApp(e.type)};onVisibilityChange=e=>{"hidden"===document.visibilityState?this.suspendApp(e.type):this.resumeApp(e.type)};onShowEffectsChange=e=>{document.querySelector(".effects-rack").classList.toggle("show",e.target.value)};onHelpModeChange=e=>{var t=e.target.value;let i=(e,t,o)=>{t=getHelpHtml(t,o);t&&(new HelpPopup(t,{target:e}).then(()=>{e.classList.toggle("help-active",!1)}),setTimeout(()=>e.classList.toggle("help-active",!0),1))},s=()=>{this._clickDetector.removeEventListener("mousedown",o),this._clickDetector.remove(),this._clickDetector=void 0,HelpPopup.currentPopup&&HelpPopup.currentPopup.close()},o=e=>{var t=Array.from(document.elementsFromPoint(e.clientX,e.clientY)),o=t.find(e=>"help-mode"===e.id||"show-effects"===e.id);o?"help-mode"===o.id?(o.value=!1,s()):"show-effects"===o.id&&(o.value=!o.value,o.dispatchChangeEvent()):(e.preventDefault(),e.stopImmediatePropagation(),(o=t.find(e=>!!(e.getAttribute("module-id")||e.getAttribute("data-module")||void 0)&&"power"!==e.getAttribute("parameter-name")))&&(e=o.getAttribute("module-id")||o.getAttribute("data-module"),t=o.getAttribute("parameter-name")||o.getAttribute("data-control")||void 0,i(o,e,t)))};(t?()=>{this._clickDetector=document.createElement("div"),document.body.appendChild(this._clickDetector),this._clickDetector.style="position: absolute; width: 100%; height: 100%; z-index: 90000; cursor: help !important",this._clickDetector.addEventListener("mousedown",o),i(e.target,"header","helpMode")}:s)()};onPowerSwitchChange=e=>{this._powerFirstTouch?(clearTimeout(this._powerFirstTouch),window.location.reload()):this._powerFirstTouch=setTimeout(()=>{delete this._powerFirstTouch},500),e.target.value?this.audioContext.resume():(this.audioContext.suspend(),this.savePatch())};showLibrary(e){var e=e.target;this._libraryView?(this._libraryView.selectPreset(this.patch.global.name,this.patch.global.bank),this._libraryRoot.classList.toggle("show")):(this._libraryRoot=document.createElement("div"),this._libraryRoot.id="library-root",this._libraryRoot.className="library-root show",this._libraryRoot.style.left=e.offsetLeft+"px",e=e.offsetTop+e.offsetHeight,this._libraryRoot.style.top=e+"px",this._libraryRoot.style.maxHeight=window.innerHeight-e+"px",document.body.appendChild(this._libraryRoot),this._libraryView=new LibraryView(this._libraryRoot.id,this._library,this.patch.global.name,this.patch.global.bank),this._libraryView.addEventListener("preset-selected",t=>{this._libraryRoot.classList.toggle("show",!1),this.loadPresetFromLibrary(t.detail).then(e=>{this.patch=initialPatch,this.patch=e,this._presetId=t.detail,location.search&&history.replaceState({},"",location.origin+location.pathname)})}))}loadPresetFromLibrary(i){return new Promise(e=>{var t=this._library.getPresetPathById(i);let o=new XMLHttpRequest;o.open("get",t),o.onload=()=>{e(JSON.parse(o.responseText))},o.send()})}dragOverHandler(e){e.preventDefault()}decodePatchFile(e){e.text().then(e=>{let o;try{o=JSON.parse(e)}catch(e){alert(e)}if(o){let e,t;void 0!==o.global&&(e=o.global.name,t=o.global.bank),e&&t?(this.patch=initialPatch,this.patch=o,this.globalPatch.set({name:e,bank:t}),location.search&&history.replaceState({},"",location.origin+location.pathname)):alert("That file is not a valid patch")}})}dropHandler(e){e.preventDefault(),e.dataTransfer.items&&(1<e.dataTransfer.items.length?alert("Please drag only one patch file onto the synth."):[...e.dataTransfer.items].forEach(e=>{"file"===e.kind&&this.decodePatchFile(e.getAsFile())}))}get _initialGlobalPatch(){return{...super._initialGlobalPatch,envelopeStretch:!1,name:"Default preset",bank:"Misc"}}savePatch(){localStorage.setItem("PolySynth-current-patch",JSON.stringify(this.patch))}loadPatch(){let o={};if(location.search&&location.search.slice(1).split("&").map(e=>{var[e,t]=e.split("=");o[e]=decodeURIComponent(t)}),o.preset){var e=this._library.getPresetByNameAndBank(o.preset,o.bank);this._presetId=e.id,this.loadPresetFromLibrary(e.id).then(e=>{this.patch=initialPatch,this.patch=e,o.changes&&this._patch.set(JSON.parse(o.changes))})}else{let e=localStorage.getItem("PolySynth-current-patch");e=e?JSON.parse(e):initialPatch;try{e&&(this.patch=initialPatch,this.patch=e);var t=this._library.getPresetByNameAndBank(this.globalPatch.get("name"),this.globalPatch.get("bank"));t&&(this._presetId=t.id)}catch(e){alert(e)}}}getPatchChanges(){return new Promise(i=>{this.loadPresetFromLibrary(this._presetId).then(e=>{let t=e,o=this.patch,n={};Object.keys(t).forEach(i=>{let s=t[i],a=o[i];Object.keys(s).forEach(e=>{var t=s[e],o=a[e];o!==t&&(n[i]||(n[i]={}),n[i][e]=o)})}),i(n)})})}sharePatch(){this.getPatchChanges().then(e=>{delete e.transient;var{name:t,bank:o}=this.globalPatch.attributes;let i=location.origin+location.pathname+"?preset="+encodeURIComponent(t)+"&bank="+encodeURIComponent(o)+"&changes="+encodeURIComponent(JSON.stringify(e));new Dialog(`
                <p class="centered"><a href='${i}' target="_blank">Click to open in new tab</a></p>
                `,{maxWidth:500,title:"Share Patch",optionLabels:["Copy link to clipboard","Cancel"]}).then(e=>{e=e.option;0===e&&navigator.clipboard.writeText(i)})})}loadPatchfromFile(e){this.decodePatchFile(e.target.files[0])}savePatchToFile(){new Dialog(`
        <form>
            <p><label for="preset-name">Patch name:</label><input type="text" name="preset-name" value="${this.globalPatch.get("name")}"/></p>
            <p><label for="patch-bank">Bank:</label><select name="patch-bank">
                ${banks.map(e=>`<option ${this.globalPatch.get("bank")===e?"selected":""}>${e}</option>`).join("")}
            </select></p>
        </form>
        `,{maxWidth:400,title:"Save Patch",optionLabels:["Save","Cancel"]}).then(e=>{var t,o,{option:e,contentElement:i}=e;0===e&&(e=i.querySelector('[name="preset-name"]').value||"patch",i=i.querySelector('[name="patch-bank"]').value||"Misc",this.globalPatch.set({name:e,bank:i}),t=document.createElement("a"),delete(o=this.patch).transient,t.setAttribute("href","data:application/json,"+encodeURIComponent(JSON.stringify(o))),t.setAttribute("download",i+`- ${e}.hspatch.json`),t.style.display="none",document.body.appendChild(t),t.click(),document.body.removeChild(t))})}onReferenceToneChange=e=>{var t=this.audioContext;e.target.value?(this._refToneNode=t.createOscillator(),this._refToneNode.type="sine",this._refToneNode.frequency.setValueAtTime(261.63,t.currentTime),this._refToneLevel=t.createGain(),this._refToneLevel.gain.setValueAtTime(.02,t.currentTime),this._refToneNode.connect(this._refToneLevel),this._refToneLevel.connect(t.destination),this._refToneNode.start()):this._refToneNode&&(this._refToneNode.stop(),this._refToneNode.disconnect(),this._refToneLevel.disconnect(),delete this._refToneNode,delete this._refToneLevel)};_render(){this._root&&(this._root.innerHTML=template())}}let launch=e=>{document.body.innerHTML=`
<style>
    #synth {
        position: absolute; 
        top: 0;
        left: 0;
        width: 100%;
        text-align: center;
    }
</style>
<div id="synth">
</div>
    `,new PolySynth("synth",e)},mousePointer=!0,normalTouchRadiusX=20,launchButton=document.getElementById("launch-button"),touchHandler=e=>{mousePointer=!1,normalTouchRadiusX=e.touches[0].radiusX,launchButton.removeEventListener("touchstart",touchHandler),launchButton.click()};launchButton.addEventListener("touchstart",touchHandler),launchButton.onclick=e=>{launch({mousePointer:mousePointer,normalTouchRadiusX:normalTouchRadiusX})};