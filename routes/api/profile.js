const express = require('express');
var router = express.Router();
const auth = require('../../middleware/auth');
const { body, validationResult } = require('express-validator');

const Profile = require('../../models/Profile');
// const User = require('../../../models/User');


// @route       GET api/profile/me
// @desc        Get current users profile
// @access      Private
router.get('/me', auth, async (req, res) => {
    try{
        const profile = await Profile.findOne({ user: req.user.id}).populate('user', 
        ['name', 'avatar']);

        if(!profile){
            return res.status(400).json({ msg: 'There is no profile for this user'});
        }
        res.json(profile);

    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route       POST api/profile
// @desc        Creat or update the user profile.
// @access      Private
router.post('/', [
    auth, [
    body('status', 'Status is required').not().isEmpty(),
    body('skills', 'Skills is required').not().isEmpty()
    ]
], 
async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }


    // Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    
    const standardFields = [
        'handle',
        'company',
        'website',
        'location',
        'bio',
        'status',
        'skills',
        'githubusername'
    ],
    socialFields = [
        'youtube',
        'twitter',
        'facebook',
        'linkedin',
        'instagram'
    ]

    // if(standardFields.skills) {
    //     standardFields.skills = skills.split(',').map(skill => skill.trim());
    // }

    standardFields.forEach(field => {
        if(req.body[field]) profileFields[field] = req.body[field];
    });

    // Build social object
    profileFields.social = {};
    socialFields.forEach(field => {
        if(req.body[field]) profileFields.social[field] = req.body[field];
    });

    try{
        let profile = await Profile.findOne({ user: req.user.id });
        if (profile){
            //Update
            profile = await Profile.findOneAndUpdate(
                { user: req.user.id }, 
                { $set: profileFields },
                { new: true, upsert: true, setDefaultsOnInsert: true }
                );

                return res.json(profile);
        }

        // Create
        profile = new Profile(profileFields);

        await profile.save();
        res.json(profile);

    } catch(err){
        console.error(err.message);
        res.status(500).send('Server error');
    }
}
);

// @route       GET api/profile
// @desc        Get all profiles
// @access      Public

router.get('/', async (req, res) => {
    try{
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles);
    } catch(err){
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route       GET api/profile/user/uer_id
// @desc        Get profile by user ID
// @access      Public

router.get('/user/:user_id', async (req, res) => {
    try{
        const profile = await Profile.findOne({ user: req.params.user_id })
        .populate(
            'user', ['name', 'avatar']
            );
        
            if (!profile) 
            return res.status(400).json({ msg: 'There is no profile for this user' });

        res.json(profile);
    } catch(err){
        console.error(err.message);
        if (err.kind == 'ObjectId') {
            return res.status(400).json({ msg: 'Profile not found' });
        }
        res.status(500).send('Server error');
    }
});

module.exports = router;