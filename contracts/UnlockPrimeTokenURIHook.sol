// SPDX-License-Identifier: MIT
pragma solidity >=0.5.17 <0.9.0;
import "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

// inspired by BokkyPooBah's Solidity DateTime Library
library Datetime {
    uint constant SECONDS_PER_DAY = 24 * 60 * 60;
    uint constant SECONDS_PER_HOUR = 60 * 60;
    uint constant SECONDS_PER_MINUTE = 60;
    int constant OFFSET19700101 = 2440588;

    // ------------------------------------------------------------------------
    // Calculate year/month/day from the number of days since 1970/01/01 using
    // the date conversion algorithm from
    //   http://aa.usno.navy.mil/faq/docs/JD_Formula.php
    // and adding the offset 2440588 so that 1970/01/01 is day 0
    //
    // int L = days + 68569 + offset
    // int N = 4 * L / 146097
    // L = L - (146097 * N + 3) / 4
    // year = 4000 * (L + 1) / 1461001
    // L = L - 1461 * year / 4 + 31
    // month = 80 * L / 2447
    // dd = L - 2447 * month / 80
    // L = month / 11
    // month = month + 2 - 12 * L
    // year = 100 * (N - 49) + year + L
    // ------------------------------------------------------------------------
    function _daysToDate(
        uint _days
    ) internal pure returns (uint year, uint month, uint day) {
        int __days = int(_days);

        int L = __days + 68569 + OFFSET19700101;
        int N = (4 * L) / 146097;
        L = L - (146097 * N + 3) / 4;
        int _year = (4000 * (L + 1)) / 1461001;
        L = L - (1461 * _year) / 4 + 31;
        int _month = (80 * L) / 2447;
        int _day = L - (2447 * _month) / 80;
        L = _month / 11;
        _month = _month + 2 - 12 * L;
        _year = 100 * (N - 49) + _year + L;

        year = uint(_year);
        month = uint(_month);
        day = uint(_day);
    }

    function timestampToDate(
        uint timestamp
    ) internal pure returns (uint year, uint month, uint day) {
        (year, month, day) = _daysToDate(timestamp / SECONDS_PER_DAY);
    }
}

/**
 * @notice Functions to be implemented by a tokenURIHook.
 * @dev Lock hooks are configured by calling `setEventHooks` on the lock.
 */
contract UnlockPrimeTokenURIHook {
    string[] internal months = [
        "", // no month for index 0
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];

    /**
     * @notice If the lock owner has registered an implementer
     * then this hook is called every time `tokenURI()` is called
     * @param lockAddress the address of the lock
     * @param operator the msg.sender issuing the call
     * @param owner the owner of the key for which we are retrieving the `tokenUri`
     * @param keyId the id (tokenId) of the key (if applicable)
     * @param expirationTimestamp the key expiration timestamp
     * @return the tokenURI
     */
    function tokenURI(
        address lockAddress,
        address operator,
        address owner,
        uint256 keyId,
        uint expirationTimestamp
    ) public view returns (string memory) {
        string memory memberId = string(
            abi.encodePacked(
                '<text fill="#603DEB" xml:space="preserve" style="white-space: pre" font-size="20" font-weight="600" letter-spacing="0em"><tspan x="277" y="570.273">',
                Strings.toHexString(owner),
                "</tspan></text>"
            )
        );

        (uint year, uint month, uint day) = Datetime.timestampToDate(
            expirationTimestamp
        );
        string memory validDeadline = string(
            abi.encodePacked(
                '<text fill="#603DEB" xml:space="preserve" style="white-space: pre" font-size="20" font-weight="600" letter-spacing="0em"><tspan x="277" y="659.273">',
                months[month], //
                " ",
                Strings.toString(day), //
                ", ",
                Strings.toString(year), //
                '&#10;</tspan><tspan x="277" y="683.273">&#10;</tspan><tspan x="277" y="707.273">&#10;</tspan><tspan x="277" y="731.273">&#10;</tspan><tspan x="277" y="755.273">&#10;</tspan><tspan x="277" y="779.273">&#10;</tspan><tspan x="277" y="803.273">&#10;</tspan><tspan x="277" y="827.273">&#10;</tspan><tspan x="277" y="851.273">&#10;</tspan><tspan x="277" y="875.273">&#10;</tspan><tspan x="277" y="899.273">&#10;</tspan><tspan x="277" y="923.273">&#10;</tspan><tspan x="277" y="947.273">&#10;</tspan></text>'
            )
        );

        // draw svg by combining all layers
        string memory svg = string(
            abi.encodePacked(
                '<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">',
                '<style>text, tspan { font-family: "Inter", Arial, "Roboto Condensed", "Open Sans", sans;  }</style>', // font
                '<rect width="1024" height="1024" fill="#F2C65E" /> <g filter="url(#filter0_d_2018_2607)"> <g clip-path="url(#clip0_2018_2607)"> <path d="M237 54H811V126H237V54Z" fill="#F5F5F5" /> <path d="M488 90C488 87.7909 489.791 86 492 86H556C558.209 86 560 87.7909 560 90V90C560 92.2091 558.209 94 556 94H492C489.791 94 488 92.2091 488 90V90Z" fill="#F2C65E" /> <rect width="574" height="166" transform="translate(237 126)" fill="#F5F5F5" /> <text fill="#211814" xml:space="preserve" style="white-space: pre" font-size="28" letter-spacing="0em"><tspan x="277" y="237.864">by Unlock Labs</tspan></text> <text fill="#211814" xml:space="preserve" style="white-space: pre" font-size="12" letter-spacing="0em"><tspan x="277" y="203.864">&#10;</tspan></text> <text fill="url(#paint0_linear_2018_2607)" xml:space="preserve" style="white-space: pre" font-size="48" font-weight="800" letter-spacing="0em"><tspan x="277" y="210.455">UNLOCK PRIME</tspan></text> <rect width="574" height="598" transform="translate(237 292)" fill="white" /> <text fill="#211814" xml:space="preserve" style="white-space: pre" font-size="51" font-weight="bold" letter-spacing="0em"><tspan x="277" y="389.545">My Unlock </tspan><tspan x="277" y="451.545">Prime Pass</tspan></text> <text fill="#211814" xml:space="preserve" style="white-space: pre" font-size="24" font-weight="500" letter-spacing="0em"><tspan x="277" y="540.545">Member ID</tspan></text> <text fill="#211814" xml:space="preserve" style="white-space: pre" font-size="18" font-weight="500" letter-spacing="0em"><tspan x="277" y="489.545">&#10;</tspan><tspan x="277" y="511.545">&#10;</tspan></text>',
                memberId,
                '<text fill="#211814" xml:space="preserve" style="white-space: pre" font-size="24" font-weight="500" letter-spacing="0em"><tspan x="277" y="629.545">Valid Through</tspan></text><text fill="#211814" xml:space="preserve" style="white-space: pre" font-size="18" font-weight="500" letter-spacing="0em"><tspan x="277" y="600.545">&#10;</tspan></text>',
                validDeadline,
                '<rect width="574" height="86" transform="translate(237 890)" fill="white" /></g></g><path fill-rule="evenodd" clip-rule="evenodd" d="M555.519 0L487 90H553.481L622 0H555.519Z" fill="white" /><path fill-rule="evenodd" clip-rule="evenodd" d="M424 0L492.519 90H559L490.481 0H424Z" fill="white" /><defs><filter id="filter0_d_2018_2607" x="209" y="26" width="630" height="978" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix" /><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" /><feMorphology radius="4" operator="dilate" in="SourceAlpha" result="effect1_dropShadow_2018_2607" /><feOffset /><feGaussianBlur stdDeviation="12" /><feColorMatrix type="matrix" values="0 0 0 0 0.129412 0 0 0 0 0.0941176 0 0 0 0 0.0784314 0 0 0 0.15 0" /><feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2018_2607" /><feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_2018_2607" result="shape" /></filter><linearGradient id="paint0_linear_2018_2607" x1="277" y1="171.491" x2="328.625" y2="14.4391" gradientUnits="userSpaceOnUse"><stop stop-color="#603DEB" /><stop offset="1" stop-color="#27C1D6" /></linearGradient><clipPath id="clip0_2018_2607"><rect x="237" y="54" width="574" height="922" rx="24" fill="white" /></clipPath></defs></svg>'
            )
        );

        // create the data uri for the image itself
        string memory image = string(
            abi.encodePacked(
                "data:image/svg+xml;base64,",
                Base64.encode(bytes(abi.encodePacked(svg)))
            )
        );

        // create the json that includes the image
        string memory json = string(
            abi.encodePacked('{"image":"', image, '"}')
        );
        // render the base64 encoded json metadata
        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(bytes(abi.encodePacked(json)))
                )
            );
    }
}
