import { YoutubeStudio } from "./YoutubeStudio.js";

(async () => {
    const studio = new YoutubeStudio();
    await studio.start();
    await studio.fetchAndSaveImpressionsByContentPage();
})();
