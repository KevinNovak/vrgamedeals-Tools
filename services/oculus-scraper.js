const _cheerio = require('cheerio');

function getExperiencePageData(experiencePageHtml) {
    let $ = _cheerio.load(experiencePageHtml, { xmlMode: false });

    let data = $('script[type="application/ld+json"]').html();
    let experienceData = JSON.parse(data);

    return {
        title: experienceData.title,
        price: '',
        originalPrice: '',
        percentOff: '',
        headsets: ['Quest', 'Rift', 'Go', 'Gear VR'],
        link: '',
    };
}

module.exports = {
    getExperiencePageData,
};
