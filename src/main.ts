import { Player } from './Player';
import { mount } from './utils/dom';

const container = document.querySelector('#app')! as HTMLElement;
mount(Player, container);
