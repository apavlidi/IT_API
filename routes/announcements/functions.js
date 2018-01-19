const Feed = require('feed');
const async = require('async');

function getAnnouncementsRSSPromise(announcements, rssCategories, categoryValues, feedType, res, isAuthenticated) {
    return new Promise(
        function (resolve, reject) {
            let calls = [], descriptionRSS;
            if (categoryValues) {
                descriptionRSS = "Ανακοινώσεις για τις παρακάτω κατηγορίες: ";
                rssCategories.forEach(category => {
                    descriptionRSS += category.name + ", ";
                });
                descriptionRSS = descriptionRSS.substr(0, descriptionRSS.lastIndexOf(","));
            } else {
                descriptionRSS = isAuthenticated ? "Όλες οι ανακοινώσεις" : "Όλες οι δημόσιες ανακοινώσεις";
            }
            let feed = new Feed({
                title: 'Τμήμα Πληροφορικής - Ανακοινώσεις',
                id: 'https://apps.it.teithe.gr/',
                description: descriptionRSS,
                generator: 'Feed for Apps',
                link: 'https://apps.it.teithe.gr/announcements',
                copyright: 'All rights reserved 2017, Alexis Pavlidis',
                feedLinks: {
                    atom: '/api/announcements/feed/atom',
                    rss: 'https://apps.it.teithe.gr/api/announcements/feed/rss',
                },
                author: {
                    name: 'Alexis Pavlidis'
                }
            });

            announcements.forEach(function (announcement) {
                calls.push(function (callback) {
                    feed.addItem({
                        title: announcement.title,
                        description: announcement._about.name,
                        link: 'https://apps.it.teithe.gr/announcements/announcement/' + announcement._id,
                        id: 'https://apps.it.teithe.gr/announcements/announcement/' + announcement._id,
                        content: announcement.text,
                        author: [{
                            name: announcement.publisher.name
                        }],
                        contributor: [],
                        date: announcement.date
                    });
                    callback(null);
                })
            });

            async.parallel(calls, function (err) {
                if (err) {
                    reject(err);
                }
                let response;
                switch (feedType) {
                    case "rss":
                        res.set('Content-Type', 'text/xml');
                        response = feed.rss2();
                        break;
                    case "json" :
                        res.setHeader('Content-Type', 'application/json');
                        response = feed.json1();
                        break;
                    default:
                        res.set('Content-Type', 'text/plain');
                        response = feed.atom1();
                }
                resolve(response);
            });
        });
}


module.exports = {
    getAnnouncementsRSSPromise
}