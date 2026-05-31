<?php

namespace SplitSMS;

/**
 * Official SplitSMS PHP SDK
 * @see https://www.splitsms.com/sdk
 */
class Client
{
    /** @var HttpClient */
    private $http;

    /** @var Sms */
    private $sms;

    /** @var Otp */
    private $otp;

    /** @var Wallet */
    private $wallet;

    /** @var Connect */
    private $connect;

    /** @var SenderIds */
    private $senderIds;

    public function __construct($apiKey, $baseUrl = 'https://www.splitsms.com')
    {
        $this->http = new HttpClient($apiKey, $baseUrl);
        $this->sms = new Sms($this->http);
        $this->otp = new Otp($this->http);
        $this->wallet = new Wallet($this->http);
        $this->connect = new Connect($this->http);
        $this->senderIds = new SenderIds($this->http);
    }

    /** @return Sms */
    public function sms()
    {
        return $this->sms;
    }

    /** @return Otp */
    public function otp()
    {
        return $this->otp;
    }

    /** @return Wallet */
    public function wallet()
    {
        return $this->wallet;
    }

    /** @return Connect */
    public function connect()
    {
        return $this->connect;
    }

    /** @return SenderIds */
    public function senderIds()
    {
        return $this->senderIds;
    }
}
