import { Injectable } from '@angular/core';
import { initFlowbite } from 'flowbite';

@Injectable({
    providedIn: 'root'
})
export class FlowbiteService {
    constructor() { }

    initFlowbite() {
        initFlowbite();
    }
} 