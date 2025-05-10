import { YoutubeStudio } from './YoutubeStudio';

export class StudioManager {
    private studioMap: Map<string, YoutubeStudio> = new Map();

    getStudio(channelId: string): YoutubeStudio {
        if (!this.studioMap.has(channelId)) {
            this.studioMap.set(channelId, new YoutubeStudio(channelId, true));
        }
        return this.studioMap.get(channelId)!;
    }
}