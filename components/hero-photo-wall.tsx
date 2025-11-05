'use client';

import { WallImage } from './WallImage';

export function HeroPhotoWall() {
    return (
        <div className="flex flex-wrap gap-4">
            <WallImage filename="1.png" alt="Hero Photo Wall" />
            <WallImage filename="2.png" alt="Hero Photo Wall" />
        </div>
    );
}