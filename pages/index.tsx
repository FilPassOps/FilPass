import {
  BanknotesIcon,
  BoltIcon,
  CodeBracketIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  LockClosedIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline'
import LinkedinIcon from 'components/LinkedinIcon'
import TwitterIcon from 'components/TwitterIcon'
import YoutubeIcon from 'components/YoutubeIcon'
import Head from 'next/head'
import Image from 'next/legacy/image'
import Link from 'next/link'
import { SVGProps } from 'react'
import { twMerge } from 'tailwind-merge'

const container = 'max-w-screen-2xl mx-auto lg:px-28'

export default function Home({ data: { features, socialLinks } }: PageProps) {
  return (
    <>
      <Head>
        <title key="company">{`Emissary - Protocol Labs`}</title>
        <meta name="theme-color" content="#4F46E5" />
        <meta
          name="description"
          content="Emissary is a tool that streamlines your invoicing workflow, making cryptocurrency transfer management effortless."
        />
      </Head>
      <header className="relative shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_rgba(0,0,0,0.06)]">
        <span className={twMerge('p-4 py-6 lg:py-9 flex items-center', container)}>
          <Image src="/logo-small.svg" alt="Application logo" width={34} height={34} className="shrink-0" />
          <div className="hidden sm:block shrink-0 w-[163px] h-5 relative ml-3">
            <Image src="/written-logo.svg" alt="Application name" layout="fill" priority />
          </div>
          <nav className="ml-auto">
            <ul className="flex gap-4">
              <li>
                <Link href="/login" className="rounded-md text-gray-500 px-4 py-2 font-medium block hover:text-indigo-600 duration-200">
                  Log In
                </Link>
              </li>
              <li>
                <Link
                  href="/signup"
                  className="rounded-md bg-indigo-600 hover:bg-indigo-500 duration-200 text-white px-4 py-2 font-medium block"
                >
                  Sign Up
                </Link>
              </li>
            </ul>
          </nav>
        </span>
      </header>
      <main>
        <section className="bg-gray-50 ">
          <span className={twMerge('flex gap-2 justify-center px-4 pt-16 pb-20 lg:justify-between lg:py-48', container)}>
            <div className="max-w-xl text-center lg:text-left animate-fadeInUp motion-reduce:animate-none lg:pr-10">
              <h1 className="text-gray-900 text-3xl lg:text-5xl font-extrabold tracking-tight">
                <strong className="text-indigo-600 font-extrabold">Introducing Emissary</strong>:
                <br />
                Streamline Your Cryptocurrency Transfer Requests
              </h1>
              <p className="text-xl text-gray-500 mt-3 mb-10 lg:mt-5">
                Say goodbye to cumbersome cryptocurrency transfer request management. Emissary streamlines your invoicing workflow, making
                cryptocurrency transfer management effortless.
              </p>
              <Link
                href="/signup"
                className="block rounded-md bg-indigo-600 hover:bg-indigo-500 duration-200 text-white py-3 px-10 font-medium w-full lg:w-fit lg:py-4 lg:text-lg"
              >
                Sign Up
              </Link>
            </div>
            <div className="hidden xl:block flex-shrink-0 overflow-hidden animate-fadeInRight motion-reduce:animate-none">
              <span className="drop-shadow-lg rounded-lg">
                <Image className="rounded-lg" src="/dashboard.png" alt="Emissary dashboard" width={600} height={400} priority />
              </span>
            </div>
          </span>
        </section>
        <section className={twMerge('pt-[4.5rem] pb-24 px-4 flex flex-col lg:px-28 lg:py-24', container)}>
          <div className="flex flex-col gap-10 lg:flex-row lg:flex-wrap lg:justify-center lg:gap-x-8 lg:gap-y-10">
            {features.map(item => {
              const Icon = featureIcons[item.icon]
              return (
                <div key={item.title} className="lg:max-w-sm">
                  <div className="bg-indigo-500 rounded-md w-12 h-12 flex justify-center items-center">
                    <Icon width={24} color="white" />
                  </div>
                  <h2 className="text-lg font-medium leading-6 text-gray-900 mt-5 mb-2">{item.title}</h2>
                  <p className="text-gray-500 leading-6">{item.description}</p>
                </div>
              )
            })}
          </div>
        </section>
      </main>
      <footer
        className={twMerge(
          'pt-20 pb-12 flex flex-col gap-9 lg:px-28 lg:py-12 lg:flex-row-reverse lg:justify-between lg:items-center',
          container,
        )}
      >
        <ul className="flex gap-6 justify-center">
          {socialLinks.map(item => {
            const Icon = socialIcons[item.label]
            return (
              <li key={item.label}>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  title={item.label}
                  className="p-1 block rounded text-gray-400 hover:text-indigo-600 duration-200"
                >
                  <Icon />
                  <span className="sr-only">{item.label}</span>
                </a>
              </li>
            )
          })}
        </ul>
        <p className="text-center text-gray-500">
          <small>
            Made with <span className="text-indigo-400">♥</span> by{' '}
            <a href="https://protocol.ai/" target="_blank" rel="noreferrer noopener">
              Protocol Labs
            </a>
          </small>
        </p>
      </footer>
    </>
  )
}

type FeatureIcon = 'lock' | 'globe' | 'lightning' | 'code' | 'scale' | 'cash' | 'mail'

type SocialNetwork = 'Twitter' | 'Linkedin' | 'Youtube'

interface PageProps {
  data: {
    features: { title: string; icon: FeatureIcon; description: string }[]
    socialLinks: { link: string; label: SocialNetwork }[]
  }
}

const featureIcons: Record<FeatureIcon, typeof LockClosedIcon> = {
  lock: LockClosedIcon,
  cash: BanknotesIcon,
  lightning: BoltIcon,
  mail: EnvelopeIcon,
  globe: GlobeAltIcon,
  code: CodeBracketIcon,
  scale: ScaleIcon,
}

const socialIcons: Record<SocialNetwork, React.FunctionComponent<React.PropsWithChildren<SVGProps<SVGSVGElement>>>> = {
  Twitter: TwitterIcon,
  Linkedin: LinkedinIcon,
  Youtube: YoutubeIcon,
}

export async function getStaticProps() {
  const props: PageProps = {
    data: {
      features: [
        {
          title: 'Simplify and Save Time',
          icon: 'lightning',
          description:
            'Effortlessly organize transfer requests in one centralized platform. No more digging through spreadsheets or juggling multiple systems. Save valuable time and effort with our intuitive interface.',
        },
        {
          title: 'Battle-Tested Reliability',
          icon: 'lock',
          description:
            'Emissary has processed thousands of transfer requests, developed and run by Protocol Labs. Trust our proven reliability and efficiency.',
        },
        {
          title: 'Multichain Support for Seamless Management',
          icon: 'globe',
          description:
            'Consolidate transfer requests from different blockchains. Currently supporting FIL, with plans to expand to other popular EVM-compatible native assets and ERC-20-compatible tokens.',
        },
        {
          title: 'Ensure Compliance with Ease',
          icon: 'scale',
          description: 'Streamline withholding processes and perform sanction checks to stay compliant when fulfilling transfer requests.',
        },
        {
          title: 'Take Control with Open Source',
          icon: 'code',
          description:
            'Emissary will be open source soon, allowing you to self-host and tailor the solution to your needs while maintaining data control.',
        },
      ],
      socialLinks: [
        { link: 'https://twitter.com/protocollabs/', label: 'Twitter' },
        { link: 'https://www.linkedin.com/company/protocollabs/', label: 'Linkedin' },
        { link: 'https://www.youtube.com/ProtocolLabs/', label: 'Youtube' },
      ],
    },
  }

  return {
    props,
  }
}
